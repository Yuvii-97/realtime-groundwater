package com.example.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "groundwater_data")
@CompoundIndexes({
        @CompoundIndex(name = "station_ts_idx", def = "{ 'stationCode': 1, 'timestamp': -1 }", unique = true)
})
public class GroundwaterData {
    @Id
    private String id;

    private String stationCode;
    private LocalDateTime timestamp;
    private double waterLevel;
    private String unit;
}


