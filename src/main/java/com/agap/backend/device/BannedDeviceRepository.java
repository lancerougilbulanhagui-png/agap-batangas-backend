package com.agap.backend.device;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BannedDeviceRepository extends JpaRepository<BannedDevice, String> {
}
