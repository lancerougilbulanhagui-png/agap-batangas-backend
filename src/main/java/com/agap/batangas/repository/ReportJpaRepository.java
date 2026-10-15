package com.agap.repository;

import com.agap.model.ReportEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportJpaRepository extends JpaRepository<ReportEntity, String> {
    List<ReportEntity> findByDeviceId(String deviceId);
    List<ReportEntity> findByStatus(String status);
}