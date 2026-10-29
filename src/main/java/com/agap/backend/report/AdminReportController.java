package com.agap.backend.report;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/reports")
public class AdminReportController {
    private final ReportService reportService;

    public AdminReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping
    public List<Report> list() {
        return reportService.findReports(null, null);
    }

    @PutMapping("/{id}/status")
    public Report updateStatus(@PathVariable String id,
                               @Valid @RequestBody UpdateReportStatusRequest request) {
        return reportService.updateStatus(id, request);
    }

    @DeleteMapping("/rejected")
    public Map<String, Long> deleteRejected() {
        return Map.of("deletedCount", reportService.deleteRejectedReports());
    }
}
