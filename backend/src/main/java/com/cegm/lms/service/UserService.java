package com.cegm.lms.service;

import com.cegm.lms.dto.request.SignUpRequest;
import com.cegm.lms.dto.response.UserResponse;
import com.cegm.lms.exception.*;
import com.cegm.lms.model.User;
import com.cegm.lms.model.enums.UserRole;
import com.cegm.lms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private SsotConfigService ssotConfigService;

    @Autowired
    private AuditLogService auditLogService;

    public User signUp(SignUpRequest request) {
        // Check for duplicate email (primary identifier for new signup flow)
        if (userRepository.existsByEmail(request.getEmail())) {
            auditLogService.logError(null, "SignUpService", "400", "Duplicate email: " + request.getEmail());
            throw new DuplicateUserException("Email already exists");
        }

        // Generate username if not provided (email prefix or unique identifier)
        String username = request.getUsername();
        if (username == null || username.trim().isEmpty()) {
            username = generateUsernameFromEmail(request.getEmail());
        }

        // Check for duplicate username after generation
        if (userRepository.existsByUsername(username)) {
            auditLogService.logError(null, "SignUpService", "400", "Duplicate username: " + username);
            throw new DuplicateUserException("Username already exists");
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(request.getEmail());
        
        // Password is now required
        String password = request.getPassword();
        if (password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("Password is required");
        }
        user.setPassword(passwordEncoder.encode(password));
        
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        
        // Use accountType field - now required
        UserRole role = request.getAccountType();
        if (role == null) {
            role = UserRole.valueOf(ssotConfigService.getDefaultAccountType());
        }
        user.setRole(role);
        
        // Set approval status based on SSoT config
        user.setApproved(!ssotConfigService.isAdminApprovalRequired());
        
        // Generate correlation ID
        user.setCorrelationId(UUID.randomUUID().toString());

        User savedUser = userRepository.save(user);
        
        auditLogService.log(savedUser.getId(), "SignUpService", "USER_CREATED", 
                          "User created: " + savedUser.getUsername());

        return savedUser;
    }

    private String generateUsernameFromEmail(String email) {
        String baseUsername = email.substring(0, email.indexOf('@'));
        String candidateUsername = baseUsername;
        int counter = 1;
        
        // Ensure username is unique
        while (userRepository.existsByUsername(candidateUsername)) {
            candidateUsername = baseUsername + counter;
            counter++;
        }
        
        return candidateUsername;
    }

    public User authenticateUser(String usernameOrEmail, String password) {
        // Try to find user by username first, then by email
        User user = userRepository.findByUsername(usernameOrEmail)
                .or(() -> userRepository.findByEmail(usernameOrEmail))
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new UnauthorizedException("Invalid credentials");
        }

        if (!user.getApproved()) {
            throw new UnauthorizedException("Account not approved");
        }

        if (!user.getActive()) {
            throw new UnauthorizedException("Account deactivated");
        }

        auditLogService.log(user.getId(), "AuthService", "LOGIN", "User logged in");
        return user;
    }

    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
    }

    public User findByCorrelationId(String correlationId) {
        return userRepository.findByCorrelationId(correlationId)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
    }

    public Page<User> getAllApprovedUsers(Pageable pageable) {
        return userRepository.findByApprovedTrue(pageable);
    }

    public Page<User> getPendingApprovalUsers(Pageable pageable) {
        return userRepository.findByApprovedFalse(pageable);
    }

    public User approveUser(Long userId) {
        User user = findById(userId);
        user.setApproved(true);
        auditLogService.log(userId, "AdminSignUpApprovalService", "USER_APPROVED", "User approved");
        return userRepository.save(user);
    }

    public User rejectUser(Long userId) {
        User user = findById(userId);
        user.setActive(false);
        auditLogService.log(userId, "AdminSignUpApprovalService", "USER_REJECTED", "User rejected");
        return userRepository.save(user);
    }

    public User promoteToAdmin(Long userId) {
        User user = findById(userId);
        user.setRole(UserRole.ADMIN);
        auditLogService.log(userId, "AllUsersService", "USER_PROMOTED", "User promoted to admin");
        return userRepository.save(user);
    }

    public User demoteToStudent(Long userId) {
        User user = findById(userId);
        user.setRole(UserRole.STUDENT);
        auditLogService.log(userId, "AllUsersService", "USER_DEMOTED", "User demoted to student");
        return userRepository.save(user);
    }

    public Page<User> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    public Page<User> getUsersByRole(UserRole role, Pageable pageable) {
        return userRepository.findByRole(role, pageable);
    }

    public Page<User> getUsersByApprovalStatus(Boolean approved, Pageable pageable) {
        return userRepository.findByApproved(approved, pageable);
    }

    public Page<User> getUsersByActiveStatus(Boolean active, Pageable pageable) {
        return userRepository.findByActive(active, pageable);
    }

    public UserResponse convertToResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole(),
                user.getApproved(),
                user.getActive(),
                user.getCreatedAt()
        );
    }

    /**
     * Search users by email, username, firstName, or lastName.
     */
    public Page<User> searchUsers(String query, Pageable pageable) {
        return userRepository.findByEmailContainingIgnoreCaseOrUsernameContainingIgnoreCaseOrFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
                query, query, query, query, pageable);
    }

    /**
     * Change user role with audit logging.
     */
    public User changeUserRole(Long userId, UserRole newRole) {
        return changeUserRole(userId, newRole, null);
    }

    /**
     * Change user role with audit logging and request ID.
     */
    public User changeUserRole(Long userId, UserRole newRole, String requestId) {
        User user = findById(userId);
        UserRole oldRole = user.getRole();
        user.setRole(newRole);
        
        String auditMessage = String.format("Role changed from %s to %s", oldRole, newRole);
        
        if (requestId != null) {
            auditLogService.logWithCorrelation(userId, "UsersController", "ROLE_CHANGE", auditMessage, requestId);
        } else {
            auditLogService.log(userId, "UsersController", "ROLE_CHANGE", auditMessage);
        }
        
        return userRepository.save(user);
    }

    /**
     * Change user status (approved/active) with audit logging.
     */
    public User changeUserStatus(Long userId, Boolean approved, Boolean active) {
        return changeUserStatus(userId, approved, active, null);
    }

    /**
     * Change user status (approved/active) with audit logging and request ID.
     */
    public User changeUserStatus(Long userId, Boolean approved, Boolean active, String requestId) {
        User user = findById(userId);
        
        if (approved != null) {
            boolean oldApproved = user.getApproved();
            user.setApproved(approved);
            String auditMessage = String.format("Approved status changed from %s to %s", oldApproved, approved);
            if (requestId != null) {
                auditLogService.logWithCorrelation(userId, "UsersController", "STATUS_CHANGE", auditMessage, requestId);
            } else {
                auditLogService.log(userId, "UsersController", "STATUS_CHANGE", auditMessage);
            }
        }
        
        if (active != null) {
            boolean oldActive = user.getActive();
            user.setActive(active);
            String auditMessage = String.format("Active status changed from %s to %s", oldActive, active);
            if (requestId != null) {
                auditLogService.logWithCorrelation(userId, "UsersController", "STATUS_CHANGE", auditMessage, requestId);
            } else {
                auditLogService.log(userId, "UsersController", "STATUS_CHANGE", auditMessage);
            }
        }
        
        return userRepository.save(user);
    }

    /**
     * Get user audit history with pagination.
     * TODO: Implement actual audit history retrieval from audit service.
     */
    public Object getUserAuditHistory(Long userId, String after, int limit) {
        // For now return empty structure that matches expected format
        // TODO: Implement proper audit history retrieval
        return java.util.Map.of(
            "data", java.util.List.of(),
            "hasNext", false,
            "cursor", ""
        );
    }

    /**
     * Check if email exists.
     */
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    /**
     * Update user profile.
     */
    public User updateProfile(User user, String requestId) {
        String auditMessage = "Profile updated";
        
        if (requestId != null) {
            auditLogService.logWithCorrelation(user.getId(), "AuthController", "PROFILE_UPDATE", auditMessage, requestId);
        } else {
            auditLogService.log(user.getId(), "AuthController", "PROFILE_UPDATE", auditMessage);
        }
        
        return userRepository.save(user);
    }

    /**
     * Change user password.
     */
    public void changePassword(String username, String currentPassword, String newPassword, String requestId) {
        User user = findByUsername(username);
        
        // Verify current password
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        
        // Set new password
        user.setPassword(passwordEncoder.encode(newPassword));
        
        String auditMessage = "Password changed";
        
        if (requestId != null) {
            auditLogService.logWithCorrelation(user.getId(), "AuthController", "PASSWORD_CHANGE", auditMessage, requestId);
        } else {
            auditLogService.log(user.getId(), "AuthController", "PASSWORD_CHANGE", auditMessage);
        }
        
        userRepository.save(user);
    }
}
