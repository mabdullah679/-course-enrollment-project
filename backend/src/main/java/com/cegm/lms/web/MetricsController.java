package com.cegm.lms.web;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;


import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Profile("dev")
@RestController("devMetricsController")     // <— distinct bean name
@RequestMapping("/api/v1/metriPcs")
public class MetricsController {

    @PersistenceContext
    private EntityManager em;

    private record ApiResponse<T>(boolean success, String message, T data, String errorCode) {}

    private long count(String jpql) {
        return ((Number) em.createQuery(jpql).getSingleResult()).longValue();
    }

    @GetMapping("/users")
    @Transactional(readOnly = true)
    public ResponseEntity<?> users() {
        try {
            long n = count("select count(u) from User u");
            return ResponseEntity.ok(new ApiResponse<>(true, "ok", n, null));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(new ApiResponse<>(false, "count failed", null, "COUNT_ERROR"));
        }
    }

    @GetMapping("/courses")
    @Transactional(readOnly = true)
    public ResponseEntity<?> courses() {
        try {
            long n = count("select count(c) from Course c");
            return ResponseEntity.ok(new ApiResponse<>(true, "ok", n, null));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(new ApiResponse<>(false, "count failed", null, "COUNT_ERROR"));
        }
    }

    @GetMapping("/enrollments")
    @Transactional(readOnly = true)
    public ResponseEntity<?> enrollments() {
        try {
            long n = count("select count(e) from Enrollment e");
            return ResponseEntity.ok(new ApiResponse<>(true, "ok", n, null));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(new ApiResponse<>(false, "count failed", null, "COUNT_ERROR"));
        }
    }

    @GetMapping("/grades")
    @Transactional(readOnly = true)
    public ResponseEntity<?> grades() {
        try {
            long n = count("select count(g) from Grade g");
            return ResponseEntity.ok(new ApiResponse<>(true, "ok", n, null));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(new ApiResponse<>(false, "count failed", null, "COUNT_ERROR"));
        }
    }
}
