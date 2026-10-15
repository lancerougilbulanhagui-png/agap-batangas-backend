package com.agap.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "reports")
public class ReportEntity {

    @Id
    private String id;
    
    private String senderName;
    private String userRole;
    private String userPhone;
    private boolean isOtpVerified;
    private String deviceId;
    private String deviceReportCount;
    private String category;
    private String severity;
    private String title;
    private String location;
    private String coordinates;
    private String submittedAt;
    private String status;

    @Column(columnDefinition = "TEXT")
    private String details;

    private boolean photoAttached;

    @ElementCollection
    private List<String> photos;

    public ReportEntity() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }

    public String getUserRole() { return userRole; }
    public void setUserRole(String userRole) { this.userRole = userRole; }

    public String getUserPhone() { return userPhone; }
    public void setUserPhone(String userPhone) { this.userPhone = userPhone; }

    public boolean isOtpVerified() { return isOtpVerified; }
    public void setOtpVerified(boolean otpVerified) { isOtpVerified = otpVerified; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public String getDeviceReportCount() { return deviceReportCount; }
    public void setDeviceReportCount(String deviceReportCount) { this.deviceReportCount = deviceReportCount; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getCoordinates() { return coordinates; }
    public void setCoordinates(String coordinates) { this.coordinates = coordinates; }

    public String getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(String submittedAt) { this.submittedAt = submittedAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public boolean isPhotoAttached() { return photoAttached; }
    public void setPhotoAttached(boolean photoAttached) { this.photoAttached = photoAttached; }

    public List<String> getPhotos() { return photos; }
    public void setPhotos(List<String> photos) { this.photos = photos; }
}