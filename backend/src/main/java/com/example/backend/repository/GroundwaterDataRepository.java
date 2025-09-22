package com.example.backend.repository;

import com.example.backend.model.GroundwaterData;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface GroundwaterDataRepository extends MongoRepository<GroundwaterData, String> {
    GroundwaterData findFirstByStationCodeOrderByTimestampDesc(String stationCode);
    List<GroundwaterData> findTop10ByStationCodeOrderByTimestampDesc(String stationCode);
    boolean existsByStationCodeAndTimestamp(String stationCode, LocalDateTime timestamp);
    List<GroundwaterData> findByStationCodeAndTimestampBetweenOrderByTimestampAsc(String stationCode, LocalDateTime start, LocalDateTime end);
}


