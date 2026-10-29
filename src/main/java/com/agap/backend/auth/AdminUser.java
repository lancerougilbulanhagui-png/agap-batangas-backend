package com.agap.backend.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "admin_users")
public class AdminUser {
    @Id
    @Column(name = "user_id")
    private UUID userId;

    protected AdminUser() {
    }
}
