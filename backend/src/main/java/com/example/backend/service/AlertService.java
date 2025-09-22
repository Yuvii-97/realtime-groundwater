package com.example.backend.service;

import com.example.backend.model.Alert;
import com.example.backend.repository.AlertRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AlertService {

    private final AlertRepository alertRepository;

    public List<Alert> listAlerts(Optional<String> stationCode, Optional<String> type, Optional<Integer> sinceDays) {
        if (stationCode.isPresent()) {
            return alertRepository.findByStationCodeOrderByCreatedAtDesc(stationCode.get());
        }
        if (type.isPresent()) {
            return alertRepository.findByAlertTypeOrderByCreatedAtDesc(type.get());
        }
        if (sinceDays.isPresent()) {
            LocalDateTime since = LocalDateTime.now().minusDays(sinceDays.get());
            return alertRepository.findAllByCreatedAtAfterOrderByCreatedAtDesc(since);
        }
        // fallback: return all (could be large)
        return alertRepository.findAll().stream()
                .sorted(Comparator.comparing(Alert::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    public Optional<Alert> getById(String id) {
        return alertRepository.findById(id);
    }

    public Map<String, Long> summaryByDistrict(Optional<String> districtOpt) {
        List<Alert> list = districtOpt.map(alertRepository::findByDistrictOrderByCreatedAtDesc)
                .orElseGet(alertRepository::findAll);
        return list.stream().collect(Collectors.groupingBy(Alert::getAlertType, Collectors.counting()));
    }
}