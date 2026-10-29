package com.agap.backend.report;

import jakarta.validation.constraints.NotBlank;

public record UpdateReportStatusRequest(
        @NotBlank String status,
        String noticeText
) {
}
