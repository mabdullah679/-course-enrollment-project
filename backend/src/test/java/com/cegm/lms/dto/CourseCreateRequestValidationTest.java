package com.cegm.lms.dto;

import com.cegm.lms.dto.request.CourseCreateRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class CourseCreateRequestValidationTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void validCourseCreateRequest() {
        // Given
        CourseCreateRequest request = new CourseCreateRequest(
                "CS101", "Introduction to Computer Science", "Basic CS course", 3);

        // When
        Set<ConstraintViolation<CourseCreateRequest>> violations = validator.validate(request);

        // Then
        assertTrue(violations.isEmpty());
    }

    @Test
    void invalidCourseCreateRequest_BlankCode() {
        // Given
        CourseCreateRequest request = new CourseCreateRequest(
                "", "Introduction to Computer Science", "Basic CS course", 3);

        // When
        Set<ConstraintViolation<CourseCreateRequest>> violations = validator.validate(request);

        // Then
        assertEquals(1, violations.size());
        ConstraintViolation<CourseCreateRequest> violation = violations.iterator().next();
        assertEquals("code", violation.getPropertyPath().toString());
        assertNotNull(violation.getMessage());
    }

    @Test
    void invalidCourseCreateRequest_BlankName() {
        // Given
        CourseCreateRequest request = new CourseCreateRequest(
                "CS101", "", "Basic CS course", 3);

        // When
        Set<ConstraintViolation<CourseCreateRequest>> violations = validator.validate(request);

        // Then
        assertEquals(1, violations.size());
        ConstraintViolation<CourseCreateRequest> violation = violations.iterator().next();
        assertEquals("name", violation.getPropertyPath().toString());
    }

    @Test
    void invalidCourseCreateRequest_NullCredits() {
        // Given
        CourseCreateRequest request = new CourseCreateRequest(
                "CS101", "Introduction to Computer Science", "Basic CS course", null);

        // When
        Set<ConstraintViolation<CourseCreateRequest>> violations = validator.validate(request);

        // Then
        assertEquals(1, violations.size());
        ConstraintViolation<CourseCreateRequest> violation = violations.iterator().next();
        assertEquals("credits", violation.getPropertyPath().toString());
    }

    @Test
    void invalidCourseCreateRequest_MultipleErrors() {
        // Given
        CourseCreateRequest request = new CourseCreateRequest(
                null, "", "Description", null);

        // When
        Set<ConstraintViolation<CourseCreateRequest>> violations = validator.validate(request);

        // Then
        assertEquals(3, violations.size()); // code, name, credits
    }
}