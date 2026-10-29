package com.agap.backend.report;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @PostMapping
    public ReportFeedItem create(@Valid @RequestBody CreateReportRequest request, Authentication authentication) {
        return ReportFeedItem.from(reportService.create(request, UUID.fromString(authentication.getName())));
    }

    @GetMapping
    public List<ReportFeedItem> list(
            @RequestParam(required = false) String status,
            Authentication authentication) {
        return reportService.findReports(UUID.fromString(authentication.getName()), status)
                .stream()
                .map(ReportFeedItem::from)
                .toList();
    }
}
