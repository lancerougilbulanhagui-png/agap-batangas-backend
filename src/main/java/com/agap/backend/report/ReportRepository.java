package com.agap.backend.report;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ReportRepository extends JpaRepository<Report, String> {
    List<Report> findAllByOrderByCreatedAtDesc();

    List<Report> findByAuthUserIdOrderByCreatedAtDesc(UUID authUserId);

    List<Report> findByAuthUserIdAndStatusOrderByCreatedAtDesc(UUID authUserId, ReportStatus status);

    List<Report> findByStatusOrderByCreatedAtDesc(ReportStatus status);

    long deleteByStatusIn(List<ReportStatus> statuses);
}
