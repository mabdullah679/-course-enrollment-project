package com.cegm.lms.controller;

import com.cegm.lms.dto.response.ApiResponse;
import com.cegm.lms.service.EnrollmentWindowService;
import com.cegm.lms.service.SsotConfigService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/config")
public class ConfigMetaController {

    private final EnrollmentWindowService enrollmentWindowService;
    private final SsotConfigService ssotConfigService;

    @Value("${service.name:CEGM-LMS}")
    private String serviceName;

    public ConfigMetaController(EnrollmentWindowService enrollmentWindowService,
                                SsotConfigService ssotConfigService) {
        this.enrollmentWindowService = enrollmentWindowService;
        this.ssotConfigService = ssotConfigService;
    }

    @GetMapping("/meta")
    public ResponseEntity<ApiResponse<Map<String, Object>>> meta() {
        Map<String, Object> enrollmentWindow = enrollmentWindowService.getEnrollmentWindowStatus();

        Map<String, Object> data = new HashMap<>();
        data.put("service", serviceName);
        data.put("enrollmentWindow", enrollmentWindow.get("state"));
        data.put("enrollmentWindowDetails", enrollmentWindow);
        data.put("enrollmentWindowRequired", ssotConfigService.isEnrollmentWindowRequired());
        data.put("student403IfWindowOff", ssotConfigService.shouldStudent403IfWindowOff());

        return ResponseEntity.ok(ApiResponse.success("Configuration metadata", data));
    }
}
