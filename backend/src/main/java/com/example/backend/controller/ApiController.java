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

    @GetMapping("/alerts")
    public ResponseEntity<?> getAlerts(
            @RequestParam(name = "stationCode", required = false) String stationCode,
            @RequestParam(name = "type", required = false) String type,
            @RequestParam(name = "sinceDays", required = false) Integer sinceDays
    ) {
        if (stationCode != null && !stationCode.isBlank()) {
            List<Alert> list = alertRepository.findByStationCodeOrderByCreatedAtDesc(stationCode);
            return ResponseEntity.ok(list);
        }
        if (type != null && !type.isBlank()) {
            // repo method is findByAlertTypeOrderByCreatedAtDesc
            List<Alert> list = alertRepository.findByAlertTypeOrderByCreatedAtDesc(type);
            return ResponseEntity.ok(list);
        }
        if (sinceDays != null) {
            LocalDateTime since = LocalDateTime.now().minusDays(sinceDays);
            return ResponseEntity.ok(alertRepository.findAllByCreatedAtAfterOrderByCreatedAtDesc(since));
        }
        return ResponseEntity.ok(alertRepository.findAll());
    }

    // Historical 90 days fill
    @PostMapping("/fillLast90Days")
    public ResponseEntity<String> fillLast90Days() {
        try {
            List<Station> stations = stationService.refreshCoimbatoreStations();
            int saved = groundwaterService.fetchAndSaveLast90Days(stations);
            return ResponseEntity.ok("Saved records: " + saved);
        } catch (Exception e) {
            // Development-only: return exception message and stacktrace to help debugging
            StringBuilder sb = new StringBuilder();
            sb.append(e.toString()).append("\n");
            for (StackTraceElement ste : e.getStackTrace()) {
                sb.append("    at ").append(ste.toString()).append("\n");
            }
            return ResponseEntity.status(500).body(sb.toString());
        }
    }

    @PostMapping("/processLast7Days")
    public ResponseEntity<?> processLast7Days(@RequestParam(name = "district", required = false) String district) {
        String use = (district == null || district.isBlank()) ? "Coimbatore" : district;
        try {
            processingService.processLast7DaysForDistrict(use);
            return ResponseEntity.ok().body(Map.of("status", "started", "district", use));
        } catch (Exception ex) {
            StringWriter sw = new StringWriter();
            ex.printStackTrace(new PrintWriter(sw));
            // dev-only: include stacktrace in response for debugging
            return ResponseEntity.status(500).body(Map.of("error", "processing failed", "exception", sw.toString()));
        }
    }
}


