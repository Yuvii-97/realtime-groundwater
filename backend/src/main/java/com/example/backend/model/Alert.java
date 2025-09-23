package com.example.backend.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "alerts")
public class Alert {
    @Id
    private String id;

    private String stationCode;
    private String stationName;
    private String district;
    private Double level;
    private String alertType; // e.g. THRESHOLD_BREACH, SUDDEN_JUMP, FALLING_TREND
    private String message;
    private LocalDateTime timestamp; // reading timestamp
    private LocalDateTime createdAt;
}


