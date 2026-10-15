package com.agap.controller;

import com.agap.model.Profile;
import com.agap.repository.ProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/profiles")
@CrossOrigin(origins = "*")
public class ProfileController {

    @Autowired
    private ProfileRepository profileRepository;

    @GetMapping
    public List<Profile> getAllProfiles() {
        return profileRepository.findAll();
    }

    @GetMapping("/device/{deviceId}")
    public ResponseEntity<Profile> getProfileByDeviceId(@PathVariable String deviceId) {
        return profileRepository.findByDeviceId(deviceId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Profile createOrUpdateProfile(@RequestBody Profile profile) {
        if (profile.getId() == null || profile.getId().isEmpty()) {
            profile.setId(profile.getDeviceId() != null ? profile.getDeviceId() : "DEV-" + System.currentTimeMillis());
        }
        return profileRepository.save(profile);
    }

    @PutMapping("/device/{deviceId}/status")
    public ResponseEntity<Profile> updateUserStatus(@PathVariable String deviceId, @RequestBody Map<String, String> payload) {
        String newStatus = payload.get("verificationStatus");
        return profileRepository.findByDeviceId(deviceId)
                .map(profile -> {
                    profile.setVerificationStatus(newStatus);
                    return ResponseEntity.ok(profileRepository.save(profile));
                })
                .orElseGet(() -> {
                    Profile newProfile = new Profile();
                    newProfile.setId(deviceId);
                    newProfile.setDeviceId(deviceId);
                    newProfile.setVerificationStatus(newStatus);
                    return ResponseEntity.ok(profileRepository.save(newProfile));
                });
    }
}
