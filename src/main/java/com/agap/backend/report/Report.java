package com.agap.backend.report;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "hazard_reports")
public class Report {
    @Id
    private String id;

    @Column(nullable = false, unique = true)
    private String ticketNo;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String hazardType;

    @Column(nullable = false)
    private String severity;

    @Column(nullable = false)
    private String location;

    private String coordinates;

    @Lob
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportStatus status;

    @Column(nullable = false)
    private String deviceId;

    @Lob
    private String proofPhotos;

    @Lob
    private String photos;

    @Lob
    private String noticeText;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected Report() {
    }

    public Report(String category, String hazardType, String severity, String location,
                  String coordinates, String description, String deviceId,
                  String proofPhotos, String photos) {
        this.id = UUID.randomUUID().toString();
        this.category = category;
        this.hazardType = hazardType;
        this.severity = severity;
        this.location = location;
        this.coordinates = coordinates;
        this.description = description;
        this.deviceId = deviceId;
        this.proofPhotos = proofPhotos;
        this.photos = photos;
        this.status = ReportStatus.PENDING;
    }

    @PrePersist
    private void prepareForInsert() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (ticketNo == null) {
            String year = String.valueOf(createdAt.atZone(java.time.ZoneOffset.UTC).getYear());
            ticketNo = "#AGAP-" + year + "-" + id.substring(0, 8).toUpperCase();
        }
    }

    public String getId() {
        return id;
    }

    public String getTicketNo() {
        return ticketNo;
    }

    public String getCategory() {
        return category;
    }

    public String getHazardType() {
        return hazardType;
    }

    public String getSeverity() {
        return severity;
    }

    public String getLocation() {
        return location;
    }

    public String getCoordinates() {
        return coordinates;
    }

    public String getDescription() {
        return description;
    }

    public ReportStatus getStatus() {
        return status;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public String getProofPhotos() {
        return proofPhotos;
    }

    public String getPhotos() {
        return photos;
    }

    public String getNoticeText() {
        return noticeText;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void updateStatus(ReportStatus status, String noticeText) {
        this.status = status;
        this.noticeText = noticeText;
    }
}
