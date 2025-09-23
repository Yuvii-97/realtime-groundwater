package com.example.backend.repository;

import com.example.backend.model.Station;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface StationRepository extends MongoRepository<Station, String> {
    List<Station> findByDistrictIdAndTelemetric(String districtId, boolean telemetric);
    Station findByStationCode(String stationCode);
}


