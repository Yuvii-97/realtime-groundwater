package com.example.backend;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.domain.Sort.Direction;

@Component
public class IndexCreator {

    private final MongoTemplate mongoTemplate;

    public IndexCreator(MongoTemplate mongoTemplate) { this.mongoTemplate = mongoTemplate; }

    @EventListener(ApplicationReadyEvent.class)
    public void ensureIndexes() {
        // unique index for groundwater_levels: station.code + timestamp
        mongoTemplate.indexOps("groundwater_levels")
                .ensureIndex(new Index().on("station.code", Direction.ASC).on("timestamp", Direction.ASC).unique());

        // TTL on groundwater_levels timestamp (90 days)
        mongoTemplate.indexOps("groundwater_levels")
                .ensureIndex(new Index().on("timestamp", Direction.ASC).expire(90L * 24L * 3600L));

        // TTL on alerts older than 30 days
        mongoTemplate.indexOps("alerts")
                .ensureIndex(new Index().on("createdAt", Direction.ASC).expire(30L * 24L * 3600L));
    }
}