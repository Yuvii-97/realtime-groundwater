package com.example.backend.scheduler;

import com.example.backend.model.Station;
import com.example.backend.service.GroundwaterService;
import com.example.backend.service.StationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@EnableScheduling
@RequiredArgsConstructor
public class DataScheduler {

    private final StationService stationService;
    private final GroundwaterService groundwaterService;

    // Every 6 hours
    @Scheduled(cron = "0 0 */6 * * *")
    public void syncLatest() {
        try {
            List<Station> stations = stationService.refreshCoimbatoreStations();
            int saved = groundwaterService.fetchAndSaveLatestForStations(stations);
            log.info("Scheduled sync: saved {} readings", saved);
        } catch (Exception e) {
            log.error("Scheduled sync failed: {}", e.getMessage());
        }
    }
}


