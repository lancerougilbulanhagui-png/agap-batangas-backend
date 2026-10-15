package com.agap.controller;

import com.agap.model.Report;
import com.agap.repository.ReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    @Autowired
    private ReportRepository reportRepository;

    @GetMapping
    public List<Report> getAllReports() {
        return reportRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Report> getReportById(@PathVariable String id) {
        return reportRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/device/{deviceId}")
    public List<Report> getReportsByDeviceId(@PathVariable String deviceId) {
        return reportRepository.findByDeviceId(deviceId);
    }

    @PostMapping
    public Report createReport(@RequestBody Report report) {
        if (report.getId() == null || report.getId().isEmpty()) {
            long count = reportRepository.count() + 1;
            String ticketNo = String.format("#AGAP-2026-%04d", count);
            report.setId(ticketNo);
            report.setTicketNo(ticketNo);
        }
        if (report.getStatus() == null) {
            report.setStatus("PENDING");
        }
        return reportRepository.save(report);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Report> updateReportStatus(@PathVariable String id, @RequestBody Map<String, String> payload) {
        String newStatus = payload.get("status");
        return reportRepository.findById(id)
                .map(report -> {
                    report.setStatus(newStatus);
                    return ResponseEntity.ok(reportRepository.save(report));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/purge-rejected")
    @Transactional
    public ResponseEntity<Map<String, String>> purgeRejectedReports() {
        List<String> purgeStatuses = List.of("REJECTED", "DELETED");
        reportRepository.deleteByStatusIn(purgeStatuses);
        return ResponseEntity.ok(Map.of("message", "All rejected data permanently purged from database."));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReport(@PathVariable String id) {
        if (reportRepository.existsById(id)) {
            reportRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
