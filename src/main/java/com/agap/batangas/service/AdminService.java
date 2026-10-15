package com.agap.service;

import com.agap.model.ReportEntity;
import com.agap.repository.ReportJpaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AdminService {

    @Autowired
    private ReportJpaRepository reportRepository;

    // Fetch all submitted reports from the database
    public List<ReportEntity> getAllSubmittedReports() {
        return reportRepository.findAll();
    }

    // Process & Save Status Update in Database (APPROVE / INVESTIGATE / REJECT)
    public ReportEntity updateReportStatus(String reportId, String newStatus, String dispatchNotice) {
        Optional<ReportEntity> optionalReport = reportRepository.findById(reportId);
        
        if (optionalReport.isPresent()) {
            ReportEntity report = optionalReport.get();
            report.setStatus(newStatus);
            
            // Log SMS dispatch notice to system
            System.out.println("[SMS DISPATCH SENT TO " + report.getUserPhone() + "]: " + dispatchNotice);
            
            return reportRepository.save(report); // Saves updated status back to database
        } else {
            throw new IllegalArgumentException("Report ID " + reportId + " not found in database.");
        }
    }

    // 1-Click Device Ban & Invalidate Associated Reports
    public void banDeviceAndRejectReports(String targetDeviceId) {
        List<ReportEntity> deviceReports = reportRepository.findByDeviceId(targetDeviceId);
        
        for (ReportEntity rep : deviceReports) {
            rep.setStatus("REJECTED");
            reportRepository.save(rep); // Save status update in DB
        }
        System.out.println("[SECURITY BLACKLIST]: Device " + targetDeviceId + " banned in DB. Reports invalidated.");
    }
}