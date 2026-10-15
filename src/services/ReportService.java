
package com.agap.service;

import com.agap.model.Report;
import com.agap.repository.ReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;

@Service
public class ReportService {

    @Autowired
    private ReportRepository reportRepository;

    public Report createReport(Report report) throws IllegalStateException {
        // Enforce Guest Rate Limit Rule (Max 3 submissions)
        if ("GUEST".equalsIgnoreCase(report.getUserRole())) {
            int currentCount = reportRepository.getDeviceReportCount(report.getDeviceId());
            if (currentCount >= 3) {
                throw new IllegalStateException("Guest Limit Reached: Maximum 3 hazard submissions allowed per guest device.");
            }
            reportRepository.incrementDeviceReportCount(report.getDeviceId());
        }

        // Generate Unique Ticket ID (#AGAP-2026-XXXX)
        int randomNum = 1000 + new Random().nextInt(9000);
        report.setTicketId("AGAP-2026-" + randomNum);
        report.setStatus("PENDING");

        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");
        report.setSubmittedAt(LocalTime.now().format(timeFormatter) + " Today");

        return reportRepository.save(report);
    }

    public List<Report> getAllReports() {
        return reportRepository.findAll();
    }
}
