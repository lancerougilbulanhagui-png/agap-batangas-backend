package com.agap.backend.device;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/devices")
public class AdminDeviceController {
    private final BannedDeviceRepository bannedDeviceRepository;

    public AdminDeviceController(BannedDeviceRepository bannedDeviceRepository) {
        this.bannedDeviceRepository = bannedDeviceRepository;
    }

    @PostMapping("/{deviceId}/ban")
    public Map<String, Object> ban(@PathVariable String deviceId) {
        bannedDeviceRepository.save(new BannedDevice(deviceId));
        return Map.of("success", true, "deviceId", deviceId);
    }
}
