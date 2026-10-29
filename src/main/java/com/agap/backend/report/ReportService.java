package com.agap.backend.report;

import com.agap.backend.device.BannedDeviceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
public class ReportService {
    private static final List<ReportStatus> ARCHIVED_STATUSES =
            List.of(ReportStatus.REJECTED, ReportStatus.DELETED);

    private final ReportRepository reportRepository;
    private final BannedDeviceRepository bannedDeviceRepository;

    public ReportService(ReportRepository reportRepository,
                         BannedDeviceRepository bannedDeviceRepository) {
        this.reportRepository = reportRepository;
        this.bannedDeviceRepository = bannedDeviceRepository;
    }

    @Transactional
    public Report create(CreateReportRequest request) {
        if (bannedDeviceRepository.existsById(request.deviceId())) {
            throw new IllegalArgumentException("This device is not allowed to submit reports.");
        }

        String category = firstNonBlank(request.hazardType(), request.category());
        if (category == null) {
            throw new IllegalArgumentException("A hazard category is required.");
        }

        return reportRepository.save(new Report(
                category,
                category,
                request.severity().trim(),
                request.location().trim(),
                request.coordinates(),
                request.description(),
                request.deviceId().trim(),
                firstNonBlank(request.proofPhotos(), request.photos()),
                firstNonBlank(request.photos(), request.proofPhotos())
        ));
    }

    @Transactional(readOnly = true)
    public List<Report> findReports(String deviceId, String status) {
        if (deviceId != null && !deviceId.isBlank() && status != null && !status.isBlank()) {
            return reportRepository.findByDeviceIdAndStatusOrderByCreatedAtDesc(
                    deviceId, parseStatus(status));
        }
        if (deviceId != null && !deviceId.isBlank()) {
            return reportRepository.findByDeviceIdOrderByCreatedAtDesc(deviceId);
        }
        if (status != null && !status.isBlank()) {
            return reportRepository.findByStatusInOrderByCreatedAtDesc(List.of(parseStatus(status)));
        }
        return reportRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public Report updateStatus(String id, UpdateReportStatusRequest request) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new ReportNotFoundException(id));
        report.updateStatus(parseStatus(request.status()), request.noticeText());
        return report;
    }

    @Transactional
    public long deleteRejectedReports() {
        return reportRepository.deleteByStatusIn(ARCHIVED_STATUSES);
    }

    private ReportStatus parseStatus(String status) {
        try {
            return ReportStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            String allowedStatuses = Arrays.toString(ReportStatus.values());
            throw new IllegalArgumentException("Unknown report status. Allowed values: " + allowedStatuses);
        }
    }

    private String firstNonBlank(String preferred, String fallback) {
        return Optional.ofNullable(preferred)
                .filter(value -> !value.isBlank())
                .orElseGet(() -> Optional.ofNullable(fallback)
                        .filter(value -> !value.isBlank())
                        .orElse(null));
    }
}
