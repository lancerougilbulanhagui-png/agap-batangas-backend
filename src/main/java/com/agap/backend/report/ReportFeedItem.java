package com.agap.backend.report;

import java.time.Instant;

public record ReportFeedItem(
        String id,
        String ticketNo,
        String category,
        String hazardType,
        String reportType,
        String severity,
        String location,
        String coordinates,
        ReportStatus status,
        Instant createdAt
) {
    public static ReportFeedItem from(Report report) {
        return new ReportFeedItem(
                report.getId(),
                report.getTicketNo(),
                report.getCategory(),
                report.getHazardType(),
                report.getReportType(),
                report.getSeverity(),
                report.getLocation(),
                report.getCoordinates(),
                report.getStatus(),
                report.getCreatedAt()
        );
    }
}
