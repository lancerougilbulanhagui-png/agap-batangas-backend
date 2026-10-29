package com.agap.backend.report;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @PostMapping
    public Report create(@Valid @RequestBody CreateReportRequest request) {
        return reportService.create(request);
    }

    @GetMapping
    public List<Report> list(
            @RequestParam(required = false) String deviceId,
            @RequestParam(required = false) String status) {
        return reportService.findReports(deviceId, status);
    }
}
