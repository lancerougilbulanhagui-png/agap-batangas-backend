package com.agap.repository;

import com.agap.model.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface ProfileRepository extends JpaRepository<Profile, String> {
    Optional<Profile> findByDeviceId(String deviceId);
    List<Profile> findByVerificationStatus(String verificationStatus);
}
