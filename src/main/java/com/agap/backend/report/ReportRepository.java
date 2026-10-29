package com.agap.backend.report;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, String> {
    List<Report> findAllByOrderByCreatedAtDesc();

    List<Report> findByDeviceIdOrderByCreatedAtDesc(String deviceId);

    List<Report> findByStatusInOrderByCreatedAtDesc(List<ReportStatus> statuses);

    List<Report> findByDeviceIdAndStatusOrderByCreatedAtDesc(String deviceId, ReportStatus status);

    long deleteByStatusIn(List<ReportStatus> statuses);
}
