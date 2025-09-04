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
        User user = findById(userId);
        UserRole oldRole = user.getRole();
        user.setRole(newRole);
        
        auditLogService.log(userId, "UsersController", "ROLE_CHANGE", 
            String.format("Role changed from %s to %s", oldRole, newRole));
        
        return userRepository.save(user);
    }
}
