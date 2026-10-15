package com.agap.controller;

import com.agap.model.ReportEntity;
import com.agap.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:3000")
public class AdminController {

    @Autowired
    private AdminService adminService;

    // GET /api/admin/reports - Fetch all database reports
    @GetMapping("/reports")
    public ResponseEntity<List<ReportEntity>> getAllReports() {
        return ResponseEntity.ok(adminService.getAllSubmittedReports());
    }

    // PUT /api/admin/reports/{id}/status - Process report action & save status in DB
    @PutMapping("/reports/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable("id") String reportId,
            @RequestBody Map<String, String> payload) {
        
        String status = payload.get("status");
        String noticeText = payload.get("noticeText");

        try {
            ReportEntity updatedReport = adminService.updateReportStatus(reportId, status, noticeText);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Report status saved as " + status);
            response.put("report", updatedReport);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // POST /api/admin/devices/{deviceId}/ban - Blacklist device & reject reports
    @PostMapping("/devices/{deviceId}/ban")
    public ResponseEntity<?> banDevice(@PathVariable("deviceId") String deviceId) {
        adminService.banDeviceAndRejectReports(deviceId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Device " + deviceId + " blacklisted. Pending tickets rejected.");

        return ResponseEntity.ok(response);
    }
}