package com.cegm.lms.controller;

import com.cegm.lms.dto.response.ApiResponse;
import com.cegm.lms.dto.response.UserResponse;
import com.cegm.lms.model.User;
import com.cegm.lms.model.enums.UserRole;
import com.cegm.lms.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UsersController.class)
class UsersControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser(roles = "ADMIN")
    void testChangeUserRole_Success() throws Exception {
        // Given
        User user = new User();
        user.setId(1L);
        user.setRole(UserRole.INSTRUCTOR);
        
        UserResponse userResponse = new UserResponse(1L, "test@example.com", "testuser", 
            "Test", "User", UserRole.INSTRUCTOR, true, true, null);

        when(userService.changeUserRole(eq(1L), eq(UserRole.INSTRUCTOR))).thenReturn(user);
        when(userService.convertToResponse(user)).thenReturn(userResponse);

        Map<String, String> request = Map.of("role", "INSTRUCTOR");

        // When & Then
        mockMvc.perform(post("/api/v1/users/1/role")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("User role changed successfully"))
                .andExpect(jsonPath("$.data.role").value("INSTRUCTOR"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void testChangeUserRole_InvalidRole() throws Exception {
        // Given
        Map<String, String> request = Map.of("role", "INVALID_ROLE");

        // When & Then
        mockMvc.perform(post("/api/v1/users/1/role")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("INVALID_ROLE"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void testChangeUserRole_MissingRole() throws Exception {
        // Given
        Map<String, String> request = Map.of();

        // When & Then
        mockMvc.perform(post("/api/v1/users/1/role")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("MISSING_ROLE"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void testUpdateUserStatus_Success() throws Exception {
        // Given
        User user = new User();
        user.setId(1L);
        user.setApproved(true);
        user.setActive(false);
        
        UserResponse userResponse = new UserResponse(1L, "test@example.com", "testuser", 
            "Test", "User", UserRole.STUDENT, true, false, null);

        when(userService.findById(eq(1L))).thenReturn(user);
        when(userService.updateApprovalStatus(eq(1L), eq(true))).thenReturn(user);
        when(userService.updateActiveStatus(eq(1L), eq(false))).thenReturn(user);
        when(userService.convertToResponse(user)).thenReturn(userResponse);

        Map<String, Object> request = Map.of("approved", true, "active", false);

        // When & Then
        mockMvc.perform(put("/api/v1/users/1/status")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("User status updated successfully"))
                .andExpect(jsonPath("$.data.approved").value(true))
                .andExpect(jsonPath("$.data.active").value(false));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void testGetUserAuditHistory_Success() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/v1/users/1/audit")
                .param("limit", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Audit history retrieved successfully"))
                .andExpect(jsonPath("$.data.entries").isArray())
                .andExpect(jsonPath("$.data.hasNext").value(false));
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void testChangeUserRole_Forbidden() throws Exception {
        // Given
        Map<String, String> request = Map.of("role", "INSTRUCTOR");

        // When & Then
        mockMvc.perform(post("/api/v1/users/1/role")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}