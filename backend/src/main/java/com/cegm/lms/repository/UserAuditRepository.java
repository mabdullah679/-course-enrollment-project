package com.cegm.lms.repository;

import com.cegm.lms.model.User;
import com.cegm.lms.model.UserAudit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserAuditRepository extends JpaRepository<UserAudit, Long> {
    List<UserAudit> findByUserOrderByCreatedAtDesc(User user);
}
