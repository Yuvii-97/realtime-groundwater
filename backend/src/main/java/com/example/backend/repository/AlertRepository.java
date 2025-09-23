package com.example.backend.repository;

import com.example.backend.model.Alert;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface AlertRepository extends MongoRepository<Alert, String> {
    boolean existsByStationCodeAndAlertTypeAndCreatedAtAfter(String stationCode, String alertType, LocalDateTime after);
    List<Alert> findByStationCodeOrderByCreatedAtDesc(String stationCode);
    List<Alert> findByAlertTypeOrderByCreatedAtDesc(String alertType);
    List<Alert> findAllByCreatedAtAfterOrderByCreatedAtDesc(LocalDateTime since);
    List<Alert> findByDistrictOrderByCreatedAtDesc(String district);
}


