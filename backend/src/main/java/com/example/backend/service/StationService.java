package com.example.backend.service;

import com.example.backend.model.Station;
import com.example.backend.repository.StationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StationService {

    private final StationRepository stationRepository;
    private final IndiaWrisClient indiaWrisClient;

    public List<Station> refreshCoimbatoreStations() {
        List<Map<String, Object>> apiStations = indiaWrisClient.fetchCoimbatoreStations();
        List<Station> toSave = apiStations.stream().map(s -> Station.builder()
                .stationCode(String.valueOf(s.get("stationcode")))
                .stationName(String.valueOf(s.get("stationname")))
                .districtId(String.valueOf(s.get("district_id")))
                .stateCode(String.valueOf(s.get("statecode")))
                .telemetric(Boolean.parseBoolean(String.valueOf(s.getOrDefault("telemetric", "true"))))
                .build()).collect(Collectors.toList());

        // upsert by stationCode
        for (Station st : toSave) {
            Station existing = stationRepository.findByStationCode(st.getStationCode());
            if (existing != null) {
                st.setId(existing.getId());
            }
            stationRepository.save(st);
        }
        return stationRepository.findByDistrictIdAndTelemetric("133112", true);
    }

    public List<Station> listCoimbatoreStations() {
        return stationRepository.findByDistrictIdAndTelemetric("133112", true);
    }
}


