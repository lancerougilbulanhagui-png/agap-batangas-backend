package com.agap.backend.report;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "reports")
public class Report {
    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "ticket_no")
    private String ticketNo;

    @Column(name = "category")
    private String category;

    @Column(name = "hazard_type")
    private String hazardType;

    @Column(name = "severity")
    private String severity;

    @Column(name = "location")
    private String location;

    @Column(name = "coordinates")
    private String coordinates;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private ReportStatus status;

    @Column(name = "device_id")
    private String deviceId;

    @Column(name = "proof_photos", columnDefinition = "text")
    private String proofPhotos;

    @Column(name = "photos", columnDefinition = "text")
    private String photos;

    @Column(name = "notice_text", columnDefinition = "text")
    private String noticeText;

    @Column(name = "created_at", nullable = false, updatable = false)
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
