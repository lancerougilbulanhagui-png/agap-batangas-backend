package com.agap.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "reports")
public class Report {

    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "ticket_no")
    private String ticketNo;

    @Column(name = "device_id")
    private String deviceId;

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

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "status")
    private String status = "PENDING";

    @Column(name = "proof_photos", columnDefinition = "TEXT")
    private String proofPhotos;

    @Column(name = "photos", columnDefinition = "TEXT")
    private String photos;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    public Report() {}

    public Report(String id, String ticketNo, String deviceId, String category, String hazardType, 
                  String severity, String location, String coordinates, String description, 
                  String status, String proofPhotos) {
        this.id = id;
        this.ticketNo = ticketNo;
        this.deviceId = deviceId;
        this.category = category;
        this.hazardType = hazardType;
        this.severity = severity;
        this.location = location;
        this.coordinates = coordinates;
        this.description = description;
        this.status = status;
        this.proofPhotos = proofPhotos;
        this.photos = proofPhotos;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTicketNo() { return ticketNo; }
    public void setTicketNo(String ticketNo) { this.ticketNo = ticketNo; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getHazardType() { return hazardType; }
    public void setHazardType(String hazardType) { this.hazardType = hazardType; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getCoordinates() { return coordinates; }
    public void setCoordinates(String coordinates) { this.coordinates = coordinates; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getProofPhotos() { return proofPhotos; }
    public void setProofPhotos(String proofPhotos) { 
        this.proofPhotos = proofPhotos; 
        this.photos = proofPhotos;
    }

    public String getPhotos() { return photos; }
    public void setPhotos(String photos) { this.photos = photos; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
