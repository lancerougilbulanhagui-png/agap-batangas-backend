package com.agap.model;

import jakarta.persistence.*;

@Entity
@Table(name = "profiles")
public class Profile {

    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "username")
    private String username;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "barangay")
    private String barangay;

    @Column(name = "device_id")
    private String deviceId;

    @Column(name = "verification_status")
    private String verificationStatus = "GUEST";

    @Column(name = "id_proof_photo", columnDefinition = "TEXT")
    private String idProofPhoto;

    public Profile() {}

    public Profile(String id, String username, String fullName, String phoneNumber, 
                   String barangay, String deviceId, String verificationStatus, String idProofPhoto) {
        this.id = id;
        this.username = username;
        this.fullName = fullName;
        this.phoneNumber = phoneNumber;
        this.barangay = barangay;
        this.deviceId = deviceId;
        this.verificationStatus = verificationStatus;
        this.idProofPhoto = idProofPhoto;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getBarangay() { return barangay; }
    public void setBarangay(String barangay) { this.barangay = barangay; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }

    public String getIdProofPhoto() { return idProofPhoto; }
    public void setIdProofPhoto(String idProofPhoto) { this.idProofPhoto = idProofPhoto; }
}
