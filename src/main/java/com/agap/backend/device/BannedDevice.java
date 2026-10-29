package com.agap.backend.device;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "banned_devices")
public class BannedDevice {
    @Id
    @Column(name = "device_id")
    private String deviceId;

    @Column(name = "banned_at", nullable = false, updatable = false)
    private Instant bannedAt;

    protected BannedDevice() {
    }

    public BannedDevice(String deviceId) {
        this.deviceId = deviceId;
    }

    @PrePersist
    private void setBannedAt() {
        if (bannedAt == null) {
            bannedAt = Instant.now();
        }
    }
}
