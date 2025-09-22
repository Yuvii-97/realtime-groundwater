package com.example.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "stations")
public class Station {
    @Id
    private String id;

    private String stationCode;
    private String stationName;
    private String districtId;
    private String stateCode;
    private boolean telemetric;
}


