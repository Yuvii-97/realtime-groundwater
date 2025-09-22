package com.example.backend.service;

import com.example.backend.model.Alert;
import com.example.backend.model.GroundwaterData;
import com.example.backend.model.Station;
import com.example.backend.repository.AlertRepository;
import com.example.backend.repository.GroundwaterDataRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class GroundwaterService {

    private final IndiaWrisClient indiaWrisClient;
    private final GroundwaterDataRepository dataRepository;
    private final AlertRepository alertRepository;

    public int fetchAndSaveLatestForStations(List<Station> stations) {
        int saved = 0;
        LocalDate today = LocalDate.now();
        LocalDate start = today.minusDays(3); // last 72h window for latest
        for (Station st : stations) {
            try {
                List<Map<String, Object>> items = indiaWrisClient.fetchStationData(st.getStationCode(), start, today);
                List<GroundwaterData> parsed = parse(items, st.getStationCode());
                parsed.sort(Comparator.comparing(GroundwaterData::getTimestamp));
                for (GroundwaterData gw : parsed) {
                    if (!dataRepository.existsByStationCodeAndTimestamp(gw.getStationCode(), gw.getTimestamp())) {
                        // Alert rules before save
                        generateAlerts(gw);
                        dataRepository.save(gw);
                        saved++;
                    }
                }
            } catch (Exception e) {
                log.warn("Failed saving latest for {}: {}", st.getStationCode(), e.getMessage());
            }
        }
        return saved;
    }

    public int fetchAndSaveLast90Days(List<Station> stations) {
        int saved = 0;
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(90);
        for (Station st : stations) {
            try {
                List<Map<String, Object>> items = indiaWrisClient.fetchStationData(st.getStationCode(), start, end);
                List<GroundwaterData> parsed = parse(items, st.getStationCode());
                parsed.sort(Comparator.comparing(GroundwaterData::getTimestamp));
                for (GroundwaterData gw : parsed) {
                    if (!dataRepository.existsByStationCodeAndTimestamp(gw.getStationCode(), gw.getTimestamp())) {
                        generateAlerts(gw);
                        dataRepository.save(gw);
                        saved++;
                    }
                }
            } catch (Exception e) {
                log.warn("Failed saving 90d for {}: {}", st.getStationCode(), e.getMessage());
            }
        }
        return saved;
    }

    public GroundwaterData getLatest(String stationCode) {
        return dataRepository.findFirstByStationCodeOrderByTimestampDesc(stationCode);
    }

    private List<GroundwaterData> parse(List<Map<String, Object>> items, String stationCode) {
        List<GroundwaterData> out = new ArrayList<>();
        for (Map<String, Object> item : items) {
            try {
                Object timeObj = item.get("dataTime");
                LocalDateTime ts;
                if (timeObj instanceof String s) {
                    // Expecting epoch millis or ISO; try both
                    if (s.matches("^\\d{10,}$")) {
                        long epoch = Long.parseLong(s);
                        ts = LocalDateTime.ofInstant(Instant.ofEpochMilli(epoch), ZoneId.systemDefault());
                    } else {
                        ts = LocalDateTime.parse(s.replace(" ", "T"));
                    }
                } else if (timeObj instanceof Number n) {
                    ts = LocalDateTime.ofInstant(Instant.ofEpochMilli(n.longValue()), ZoneId.systemDefault());
                } else {
                    continue;
                }

                double value = 0.0;
                Object valObj = item.get("dataValue");
                if (valObj != null) value = Double.parseDouble(String.valueOf(valObj));

                GroundwaterData gw = GroundwaterData.builder()
                        .stationCode(stationCode)
                        .timestamp(ts)
                        .waterLevel(value)
                        .unit("m")
                        .build();
                out.add(gw);
            } catch (Exception ignore) {
            }
        }
        return out;
    }

    private void generateAlerts(GroundwaterData newReading) {
        // Threshold Breach: waterLevel < -15
        if (newReading.getWaterLevel() < -15) {
            alertRepository.save(Alert.builder()
                    .stationCode(newReading.getStationCode())
                    .alertType("THRESHOLD_BREACH")
                    .message("Water level below -15 m (" + newReading.getWaterLevel() + ")")
                    .createdAt(LocalDateTime.now())
                    .build());
        }

        // Sudden Jump: change > 1m since last reading
        GroundwaterData last = dataRepository.findFirstByStationCodeOrderByTimestampDesc(newReading.getStationCode());
        if (last != null) {
            double diff = Math.abs(newReading.getWaterLevel() - last.getWaterLevel());
            if (diff > 1.0) {
                alertRepository.save(Alert.builder()
                        .stationCode(newReading.getStationCode())
                        .alertType("SUDDEN_JUMP")
                        .message("Sudden change > 1m (Δ=" + String.format("%.2f", diff) + ")")
                        .createdAt(LocalDateTime.now())
                        .build());
            }
        }

        // Trend Detection: falling for last 10 readings (more negative => deeper)
        List<GroundwaterData> last10 = dataRepository.findTop10ByStationCodeOrderByTimestampDesc(newReading.getStationCode());
        if (last10 != null && last10.size() >= 9) {
            // include new reading at the end
            last10.add(0, newReading); // ensure newest first
            boolean strictlyFalling = true;
            for (int i = 0; i < Math.min(9, last10.size() - 1); i++) {
                if (!(last10.get(i).getWaterLevel() < last10.get(i + 1).getWaterLevel())) {
                    strictlyFalling = false;
                    break;
                }
            }
            if (strictlyFalling) {
                alertRepository.save(Alert.builder()
                        .stationCode(newReading.getStationCode())
                        .alertType("FALLING_TREND")
                        .message("Water level falling for last 10 readings")
                        .createdAt(LocalDateTime.now())
                        .build());
            }
        }
    }
}


