package com.agap.model;

import java.util.List;

public class Report {
    private String ticketId;
    private String category;
    private String severity;
    private String location;
    private String coordinates;
    private String description;
    private int photoCount;
    private List<String> photos;
    private String userRole;
    private String contactPhone;
    private String deviceId;
    private String status;
    private String submittedAt;

    public Report() {}

    public Report(String ticketId, String category, String severity, String location, 
                  String coordinates, String description, List<String> photos, 
                  String userRole, String contactPhone, String deviceId, 
                  String status, String submittedAt) {
        this.ticketId = ticketId;
        this.category = category;
        this.severity = severity;
        this.location = location;
        this.coordinates = coordinates;
        this.description = description;
        this.photos = photos;
        this.photoCount = photos != null ? photos.size() : 0;
        this.userRole = userRole;
        this.contactPhone = contactPhone;
        this.deviceId = deviceId;
        this.status = status;
        this.submittedAt = submittedAt;
    }

    // Getters and Setters
    public String getTicketId() { return ticketId; }
    public void setTicketId(String ticketId) { this.ticketId = ticketId; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getCoordinates() { return coordinates; }
    public void setCoordinates(String coordinates) { this.coordinates = coordinates; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getPhotoCount() { return photoCount; }
    public void setPhotoCount(int photoCount) { this.photoCount = photoCount; }

    public List<String> getPhotos() { return photos; }
    public void setPhotos(List<String> photos) { 
        this.photos = photos; 
        this.photoCount = photos != null ? photos.size() : 0;
    }

    public String getUserRole() { return userRole; }
    public void setUserRole(String userRole) { this.userRole = userRole; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(String submittedAt) { this.submittedAt = submittedAt; }
}