package com.cegm.lms.controller;

import com.cegm.lms.model.User;
import com.cegm.lms.model.enums.UserRole;
import com.cegm.lms.service.UserService;
import com.cegm.lms.service.SessionManagementService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UsersController.class)
class UsersControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @MockBean
    private SessionManagementService sessionManagementService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser(roles = "ADMIN")
    void changeUserRole_Success() throws Exception {
        // Given
        User user = createTestUser();
        user.setRole(UserRole.INSTRUCTOR);
        when(userService.changeUserRole(eq(1L), eq(UserRole.INSTRUCTOR), anyString())).thenReturn(user);

        Map<String, String> request = new HashMap<>();
        request.put("role", "INSTRUCTOR");

        // When & Then
        mockMvc.perform(post("/api/v1/users/1/role")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-Request-Id", "test-request-123")
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("User role changed successfully"))
                .andExpect(jsonPath("$.data.role").value("INSTRUCTOR"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void changeUserRole_InvalidRole() throws Exception {
        // Given
        Map<String, String> request = new HashMap<>();
        request.put("role", "INVALID_ROLE");

        // When & Then
        mockMvc.perform(post("/api/v1/users/1/role")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Invalid role: INVALID_ROLE"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void changeUserStatus_Success() throws Exception {
        // Given
        User user = createTestUser();
        user.setActive(false);
        when(userService.changeUserStatus(eq(1L), isNull(), eq(false), anyString())).thenReturn(user);

        Map<String, Boolean> request = new HashMap<>();
        request.put("active", false);

        // When & Then
        mockMvc.perform(put("/api/v1/users/1/status")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-Request-Id", "test-request-456")
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.active").value(false));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void changeUserStatus_MissingFields() throws Exception {
        // Given
        Map<String, String> request = new HashMap<>();

        // When & Then
        mockMvc.perform(put("/api/v1/users/1/status")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("At least one of 'approved' or 'active' must be provided"));
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void changeUserRole_Forbidden() throws Exception {
        // Given
        Map<String, String> request = new HashMap<>();
        request.put("role", "ADMIN");

        // When & Then
        mockMvc.perform(post("/api/v1/users/1/role")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getUserAuditHistory_Success() throws Exception {
        // Given
        Map<String, Object> auditResponse = new HashMap<>();
        auditResponse.put("data", java.util.List.of());
        auditResponse.put("hasNext", false);
        auditResponse.put("cursor", "");
        
        when(userService.getUserAuditHistory(eq(1L), anyString(), anyInt())).thenReturn(auditResponse);

        // When & Then
        mockMvc.perform(get("/api/v1/users/1/audit")
                .param("limit", "25")
                .param("after", "cursor123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.data").isArray())
                .andExpect(jsonPath("$.data.hasNext").value(false));
    }

    private User createTestUser() {
        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setFirstName("Test");
        user.setLastName("User");
        user.setRole(UserRole.STUDENT);
        user.setApproved(true);
        user.setActive(true);
        return user;
    }
}