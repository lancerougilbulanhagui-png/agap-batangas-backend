package com.agap.backend.auth;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AdminUserRepository extends JpaRepository<AdminUser, UUID> {
}
