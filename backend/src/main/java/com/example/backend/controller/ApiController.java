package com.example.backend.controller;

import com.example.backend.model.Alert;
import com.example.backend.model.GroundwaterData;
import com.example.backend.model.Station;
import com.example.backend.repository.AlertRepository;
import com.example.backend.service.GroundwaterProcessingService;
import com.example.backend.service.GroundwaterService;
import com.example.backend.service.StationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ApiController {

    private final StationService stationService;
    private final GroundwaterService groundwaterService;
    private final AlertRepository alertRepository;
    private final GroundwaterProcessingService processingService;

    @GetMapping("/stations")
    public List<Station> stations() {
        return stationService.listCoimbatoreStations();
    }

    @GetMapping("/stations/{stationCode}/latest")
    public ResponseEntity<GroundwaterData> latest(@PathVariable String stationCode) {
        GroundwaterData latest = groundwaterService.getLatest(stationCode);
        if (latest == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(latest);
    }

    // Removed duplicate alerts endpoint. Use AlertsController (/api/alerts) instead.

    @PostMapping("/processLast7Days")
    public ResponseEntity<?> processLast7Days(@RequestParam(name = "district", required = false) String district) {
        String use = (district == null || district.isBlank()) ? "Coimbatore" : district;
        try {
            processingService.processLast7DaysForDistrict(use);
            return ResponseEntity.ok().body(Map.of("status", "started", "district", use));
        } catch (Exception ex) {
            StringWriter sw = new StringWriter();
            ex.printStackTrace(new PrintWriter(sw));
            return ResponseEntity.status(500).body(Map.of("error", "processing failed", "exception", sw.toString()));
        }
    }
}


