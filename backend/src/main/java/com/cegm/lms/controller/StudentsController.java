package com.cegm.lms.controller;

import com.cegm.lms.dto.response.StudentResponse;
import com.cegm.lms.model.enums.UserRole;
import com.cegm.lms.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/students")
@CrossOrigin
public class StudentsController {

    @Autowired
    private UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<List<StudentResponse>> getStudents(
            @RequestParam(defaultValue = "50") int size) {
        
        List<StudentResponse> students = userService.getStudentsForModal(size);
        return ResponseEntity.ok(students);
    }
}