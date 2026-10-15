package com.agap.repository;

import com.agap.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, String> {
    List<Report> findByStatus(String status);
    List<Report> findByDeviceId(String deviceId);
    List<Report> findByStatusIn(List<String> statuses);
    void deleteByStatusIn(List<String> statuses);
}
