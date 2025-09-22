package com.example.backend.controller;

import com.example.backend.model.Alert;
import com.example.backend.service.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertsController {

    private final AlertService alertService;

    // GET /api/alerts?stationCode=...&type=...&sinceDays=...
    @GetMapping
    public ResponseEntity<List<Alert>> list(
            @RequestParam(name = "stationCode", required = false) String stationCode,
            @RequestParam(name = "type", required = false) String type,
            @RequestParam(name = "sinceDays", required = false) Integer sinceDays
    ) {
        List<Alert> list = alertService.listAlerts(Optional.ofNullable(stationCode), Optional.ofNullable(type), Optional.ofNullable(sinceDays));
        return ResponseEntity.ok(list);
    }

    // GET /api/alerts/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable String id) {
        return alertService.getById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // GET /api/alerts/summary?district=Coimbatore
    @GetMapping("/summary")
    public ResponseEntity<Map<String, Long>> summary(@RequestParam(name = "district", required = false) String district) {
        Map<String, Long> summary = alertService.summaryByDistrict(Optional.ofNullable(district));
        return ResponseEntity.ok(summary);
    }
}