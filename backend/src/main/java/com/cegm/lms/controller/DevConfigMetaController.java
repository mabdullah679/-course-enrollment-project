// src/main/java/com/cegm/lms/controller/DevConfigMetaController.java
package com.cegm.lms.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@Profile("dev")
@RequestMapping("/api/v1")
public class DevConfigMetaController {

    @Value("${service.name:service}")
    private String serviceName;

    private Map<String, Object> msgBody() {
        return Map.of(
            "success", true,
            "message", serviceName + " not available in dev profile."
        );
    }

    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> config() {
        return ResponseEntity.ok(msgBody());
    }

    @GetMapping("/config/meta")
    public ResponseEntity<Map<String, Object>> meta() {
        return ResponseEntity.ok(msgBody());
    }
}
