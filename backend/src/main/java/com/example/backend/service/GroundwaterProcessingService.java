package com.example.backend.service;

import com.example.backend.model.Alert;
import com.example.backend.repository.AlertRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class GroundwaterProcessingService {

    private static final Logger log = LoggerFactory.getLogger(GroundwaterProcessingService.class);

    private final RestTemplate restTemplate;
    private final MongoTemplate mongoTemplate;
    private final AlertRepository alertRepository;

    @Value("${indiawris.base:https://indiawris.gov.in}")
    private String baseUrl;

    // sensible defaults; per-station overrides can be stored in collection "station_thresholds"
    private static final double DEFAULT_THRESHOLD_BREACH = -15.0; // example threshold breach (< -15)
    private static final double DEFAULT_SUDDEN_JUMP = 1.0; // meters
    private static final int DEFAULT_TREND_DAYS = 10; // days to check decreasing trend
    private static final int ALERT_DEDUP_HOURS = 24; // dedupe window

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    public GroundwaterProcessingService(RestTemplate restTemplate, MongoTemplate mongoTemplate, AlertRepository alertRepository) {
        this.restTemplate = restTemplate;
        this.mongoTemplate = mongoTemplate;
        this.alertRepository = alertRepository;
    }

    // scheduled every 6 hours
    @Scheduled(cron = "0 0 */6 * * *")
    public void scheduledRun() {
        log.info("Scheduled run: process last 7 days for default district Coimbatore");
        processLast7DaysForDistrict("Coimbatore");
    }

    public void processLast7DaysForDistrict(String districtName) {
        try {
            log.info("Processing last 7 days for district={}", districtName);
            String stateCode = "22"; // Tamil Nadu
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            Map<String,Object> body = Map.of("statecode", stateCode, "datasetcode", "GWATERLVL");
            ResponseEntity<Map> districtsResp = restTemplate.postForEntity(baseUrl + "/masterDistrict/getDistrictbyState",
                    new HttpEntity<>(body, headers), Map.class);

            List<Map<String,Object>> districts = (List<Map<String,Object>>) (districtsResp.getBody() == null ? null : districtsResp.getBody().get("data"));
            if (districts == null) {
                log.warn("No districts returned from IndiaWRIS");
                return;
            }

            for (Map<String,Object> district : districts) {
                String name = String.valueOf(district.get("districtname"));
                if (!name.equalsIgnoreCase(districtName)) continue;
                String districtId = String.valueOf(district.get("district_id"));

                Map<String,Object> stationsReq = Map.of(
                        "district_id", districtId,
                        "agencyid", "113",
                        "datasetcode", "GWATERLVL",
                        "telemetric", "true"
                );

                ResponseEntity<Map> stationsResp = restTemplate.postForEntity(baseUrl + "/masterStationDS/stationDSList",
                        new HttpEntity<>(stationsReq, headers), Map.class);

                List<Map<String,Object>> stations = (List<Map<String,Object>>) (stationsResp.getBody() == null ? null : stationsResp.getBody().get("data"));
                if (stations == null) {
                    log.warn("No stations returned for district {}", name);
                    continue;
                }

                LocalDate end = LocalDate.now();
                LocalDate start = end.minusDays(7);
                String startStr = DATE_FMT.format(start);
                String endStr = DATE_FMT.format(end);

                for (Map<String,Object> station : stations) {
                    try {
                        String stationCode = String.valueOf(station.get("stationcode"));
                        String stationName = String.valueOf(station.get("stationname"));
                        processStationForRange(stationCode, stationName, name, startStr, endStr, headers);
                    } catch (Exception ex) {
                        log.error("Per-station failure, continuing with next station", ex);
                    }
                }
            }

        } catch (Exception e) {
            log.error("Processing failed", e);
            throw new RuntimeException("processing failed", e);
        }
    }

    private void processStationForRange(String stationCode, String stationName, String district,
                                        String startStr, String endStr, HttpHeaders headers) {
        Map<String,Object> payload = Map.of(
                "station_code", stationCode,
                "starttime", startStr,
                "endtime", endStr,
                "dataset", "GWATERLVL"
        );

        ResponseEntity<Map> dataResp = restTemplate.postForEntity(baseUrl + "/CommonDataSetMasterAPI/getCommonDataSetByStationCode",
                new HttpEntity<>(payload, headers), Map.class);

        List<Map<String,Object>> entries = (List<Map<String,Object>>) (dataResp.getBody() == null ? null : dataResp.getBody().get("data"));
        if (entries == null || entries.isEmpty()) {
            log.debug("No entries for station {}", stationCode);
            return;
        }

        // get per-station thresholds if present
        Map<String, Object> thr = mongoTemplate.findOne(new Query(Criteria.where("stationCode").is(stationCode)), Map.class, "station_thresholds");
        double thresholdBreach = thr != null && thr.get("thresholdBreach") != null ? Double.parseDouble(String.valueOf(thr.get("thresholdBreach"))) : DEFAULT_THRESHOLD_BREACH;
        double suddenJump = thr != null && thr.get("suddenJump") != null ? Double.parseDouble(String.valueOf(thr.get("suddenJump"))) : DEFAULT_SUDDEN_JUMP;
        int trendDays = thr != null && thr.get("trendDays") != null ? Integer.parseInt(String.valueOf(thr.get("trendDays"))) : DEFAULT_TREND_DAYS;

        for (Map<String,Object> entry : entries) {
            try {
                String dataTimeRaw = String.valueOf(entry.get("dataTime"));
                // robust ISO parsing
                Date timestamp = parseIsoToDate(dataTimeRaw);
                double value;
                try {
                    value = Double.parseDouble(String.valueOf(entry.get("dataValue")));
                } catch (Exception ex) {
                    log.debug("Skipping non-numeric value for {}: {}", stationCode, entry.get("dataValue"));
                    continue;
                }

                // upsert into groundwater_levels (unique by station.code + timestamp)
                Query q = new Query();
                q.addCriteria(Criteria.where("station.code").is(stationCode).and("timestamp").is(timestamp));
                Update u = new Update()
                        .set("timestamp", timestamp)
                        .set("station", Map.of("code", stationCode, "name", stationName, "district", district))
                        .set("value", value)
                        .set("unit", entry.getOrDefault("unitCode", "m"));
                mongoTemplate.upsert(q, u, "groundwater_levels");

                // Alert rules
                // 1) Threshold breach
                if (value < thresholdBreach) {
                    maybeCreateAlert(stationCode, stationName, district, value, "threshold_breach",
                            "Water level below threshold " + thresholdBreach, timestamp);
                }

                // 2) Sudden jumps: compare to latest previous reading
                Date prevTs = getPreviousTimestampForStation(stationCode, timestamp);
                if (prevTs != null) {
                    Double prevVal = getLatestValueForStationAt(stationCode, prevTs);
                    if (prevVal != null) {
                        if (Math.abs(value - prevVal) > suddenJump) {
                            maybeCreateAlert(stationCode, stationName, district, value, "sudden_jump",
                                    String.format("Sudden jump %.2fm (prev=%.2f, now=%.2f) > %.2f", value - prevVal, prevVal, value, suddenJump),
                                    timestamp);
                        }
                    }
                }

                // 3) Trend detection: last N readings strictly decreasing
                List<Double> recent = fetchLastNValues(stationCode, trendDays);
                if (recent.size() >= trendDays) {
                    boolean strictlyFalling = true;
                    for (int i = 1; i < recent.size(); i++) {
                        if (!(recent.get(i) < recent.get(i-1))) { strictlyFalling = false; break; }
                    }
                    if (strictlyFalling) {
                        maybeCreateAlert(stationCode, stationName, district, value, "trend_down",
                                "Water level falling for " + trendDays + " consecutive readings", timestamp);
                    }
                }

            } catch (Exception ex) {
                log.warn("Skipping entry due to parse/store error for station {}", stationCode, ex);
            }
        }
    }

    private Date parseIsoToDate(String raw) {
        try {
            // attempt full instant parse
            Instant inst = Instant.parse(raw);
            return Date.from(inst);
        } catch (Exception e) {
            try {
                // fallback parse date-only yyyy-MM-dd
                LocalDate d = LocalDate.parse(raw.substring(0, 10), DATE_FMT);
                return Date.from(d.atStartOfDay(java.time.ZoneOffset.UTC).toInstant());
            } catch (Exception ex) {
                // fallback to now
                return new Date();
            }
        }
    }

    private Date getPreviousTimestampForStation(String stationCode, Date before) {
        Query q = new Query();
        q.addCriteria(Criteria.where("station.code").is(stationCode).and("timestamp").lt(before));
        q.limit(1);
        q.with(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "timestamp"));
        Map doc = mongoTemplate.findOne(q, Map.class, "groundwater_levels");
        if (doc == null) return null;
        Object ts = doc.get("timestamp");
        if (ts instanceof Date) return (Date) ts;
        return null;
    }

    private Double getLatestValueForStationAt(String stationCode, Date ts) {
        Query q = new Query(Criteria.where("station.code").is(stationCode).and("timestamp").is(ts));
        Map doc = mongoTemplate.findOne(q, Map.class, "groundwater_levels");
        if (doc == null) return null;
        Object v = doc.get("value");
        try { return Double.parseDouble(String.valueOf(v)); } catch (Exception e) { return null; }
    }

    private List<Double> fetchLastNValues(String stationCode, int n) {
        Query q = new Query(Criteria.where("station.code").is(stationCode));
        q.limit(n);
        q.with(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "timestamp"));
        List<Map> docs = mongoTemplate.find(q, Map.class, "groundwater_levels");
        List<Double> vals = new ArrayList<>();
        for (Map d : docs) {
            Object v = d.get("value");
            try { vals.add(Double.parseDouble(String.valueOf(v))); } catch (Exception e) { }
        }
        Collections.reverse(vals); // oldest -> newest order for trend check
        return vals;
    }

    private void maybeCreateAlert(String stationCode, String stationName, String district, double level, String type, String message, Date readingTs) {
        // dedupe: don't create same type alert for station within last ALERT_DEDUP_HOURS
        LocalDateTime dedupeAfter = LocalDateTime.now().minusHours(ALERT_DEDUP_HOURS);
        if (alertRepository.existsByStationCodeAndAlertTypeAndCreatedAtAfter(stationCode, type, dedupeAfter)) {
            log.debug("Dedup: skipping alert {} for station {} (recent exists)", type, stationCode);
            return;
        }

        // convert java.util.Date -> LocalDateTime for Alert model
        LocalDateTime readingLocal = (readingTs == null)
                ? LocalDateTime.now()
                : LocalDateTime.ofInstant(readingTs.toInstant(), ZoneId.systemDefault());

        Alert a = Alert.builder()
                .stationCode(stationCode)
                .stationName(stationName)
                .district(district)
                .level(level)
                .alertType(type)
                .message(message)
                .timestamp(readingLocal)
                .createdAt(LocalDateTime.now())
                .build();

        alertRepository.save(a);
        log.info("Created alert [{}] for station {}: {}", type, stationCode, message);
    }
}