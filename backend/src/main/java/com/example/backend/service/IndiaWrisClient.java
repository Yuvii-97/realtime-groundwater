package com.example.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class IndiaWrisClient {

    private final RestTemplate restTemplate;

    private static final String STATIONS_URL = "https://indiawris.gov.in/masterStationDS/stationDSList";
    private static final String DATA_URL = "https://indiawris.gov.in/CommonDataSetMasterAPI/getCommonDataSetByStationCode";

    public List<Map<String, Object>> fetchCoimbatoreStations() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("district_id", "133112");
        payload.put("agencyid", "113");
        payload.put("datasetcode", "GWATERLVL");
        payload.put("telemetric", "true");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        Map<?, ?> response = restTemplate.postForObject(STATIONS_URL, request, Map.class);
        if (response == null) return List.of();
        Object data = response.get("data");
        if (data instanceof List<?> list) {
            //noinspection unchecked
            return (List<Map<String, Object>>) (List<?>) list;
        }
        return List.of();
    }

    public List<Map<String, Object>> fetchStationData(String stationCode, LocalDate start, LocalDate end) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("station_code", stationCode);
        payload.put("starttime", start.toString());
        payload.put("endtime", end.toString());
        payload.put("dataset", "GWATERLVL");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        Map<?, ?> response = restTemplate.postForObject(DATA_URL, request, Map.class);
        if (response == null) return List.of();
        Object data = response.get("data");
        if (data instanceof List<?> list) {
            //noinspection unchecked
            return (List<Map<String, Object>>) (List<?>) list;
        }
        return List.of();
    }
}


