package com.cegm.lms.repository;

import com.cegm.lms.model.User;
import com.cegm.lms.model.enums.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByUsername(String username);
    
    Optional<User> findByEmail(String email);
    
    Optional<User> findByCorrelationId(String correlationId);
    
    boolean existsByUsername(String username);
    
    boolean existsByEmail(String email);
    
    Page<User> findByApprovedTrue(Pageable pageable);
    
    Page<User> findByApprovedFalse(Pageable pageable);
    
    Page<User> findByApproved(Boolean approved, Pageable pageable);
    
    Page<User> findByActive(Boolean active, Pageable pageable);
    
    Page<User> findByRole(UserRole role, Pageable pageable);
    
    // Count methods for metrics
    long countByApprovedFalse();
    
    long countByActiveTrue();
    
    long countByRole(UserRole role);
    
    @Query("SELECT u FROM User u WHERE u.approved = true AND u.active = true")
    Page<User> findActiveApprovedUsers(Pageable pageable);
    
    @Query("SELECT u FROM User u WHERE u.role = :role AND u.approved = true AND u.active = true")
    Page<User> findActiveApprovedUsersByRole(@Param("role") UserRole role, Pageable pageable);
    
    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<User> findByEmailContainingIgnoreCaseOrUsernameContainingIgnoreCaseOrFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
            @Param("query") String email, @Param("query") String username, 
            @Param("query") String firstName, @Param("query") String lastName, Pageable pageable);
    
    /**
     * Combined filter search with text query and additional filters.
     */
    @Query("SELECT u FROM User u WHERE " +
           "(LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "AND (:role IS NULL OR u.role = :role) " +
           "AND (:approved IS NULL OR u.approved = :approved) " +
           "AND (:active IS NULL OR u.active = :active)")
    Page<User> findBySearchTermAndFilters(
            @Param("query") String query,
            @Param("role") UserRole role,
            @Param("approved") Boolean approved, 
            @Param("active") Boolean active,
            Pageable pageable);
    
    /**
     * Combined filters without text search.
     */
    @Query("SELECT u FROM User u WHERE " +
           "(:role IS NULL OR u.role = :role) " +
           "AND (:approved IS NULL OR u.approved = :approved) " +
           "AND (:active IS NULL OR u.active = :active)")
    Page<User> findByFilters(
            @Param("role") UserRole role,
            @Param("approved") Boolean approved, 
            @Param("active") Boolean active,
            Pageable pageable);
}
