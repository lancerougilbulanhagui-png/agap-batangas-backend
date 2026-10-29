package com.agap.backend.report;

import jakarta.validation.constraints.NotBlank;

public record CreateReportRequest(
        String category,
        String hazardType,
        @NotBlank String severity,
        @NotBlank String location,
        String coordinates,
        String description,
        @NotBlank String deviceId,
        String proofPhotos,
        String photos
) {
}
