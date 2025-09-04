package com.cegm.lms.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class HealthController {

    @Value("${spring.profiles.active:dev}")
    private String environment;

    @Value("${app.build.sha:unknown}")
    private String buildSha;

    @Value("${app.version:0.0.1-SNAPSHOT}")
    private String version;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        // Return application health status
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("env", environment);
        response.put("region", System.getProperty("user.timezone", "unknown"));
        response.put("build_sha", buildSha);
        response.put("version", version);
        response.put("timestamp", Instant.now().toString());
        
        return ResponseEntity.ok(response);
    }
}
