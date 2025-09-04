package com.cegm.lms.dto.request;

import com.cegm.lms.model.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class SignUpRequest {
    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @Email(message = "Valid email is required")
    @NotBlank(message = "Email is required")
    private String email;

    @NotNull(message = "Account type is required")
    private UserRole accountType;

    private String username; // Optional - will be generated if not provided

    @NotBlank(message = "Password is required")
    private String password;

    // Constructors
    public SignUpRequest() {}

    public SignUpRequest(String firstName, String lastName, String email, UserRole accountType, String password) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.accountType = accountType;
        this.password = password;
    }

    // Getters and Setters
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public UserRole getAccountType() { return accountType; }
    public void setAccountType(UserRole accountType) { this.accountType = accountType; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public UserRole getRole() { return accountType; }
}
