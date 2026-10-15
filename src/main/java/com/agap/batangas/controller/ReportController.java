package com.agap.controller;

import com.agap.model.Report;
import com.agap.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000") // Enable connection from React frontend
public class ReportController {

    @Autowired
    private ReportService reportService;

    // POST /api/reports
    @PostMapping("/reports")
    public ResponseEntity<?> submitReport(@RequestBody Report report) {
        try {
            if (report.getCategory() == null || report.getSeverity() == null || 
                report.getLocation() == null || report.getDescription() == null) {
                Map<String, Object> err = new HashMap<>();
                err.put("error", "Missing mandatory hazard report details.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
            }

            Report createdReport = reportService.createReport(report);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Hazard report successfully dispatched.");
            response.put("report", createdReport);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalStateException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(err);
        }
    }

    // POST /api/auth/send-otp
    @PostMapping("/auth/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> request) {
        String phone = request.get("phone");
        if (phone == null || phone.isEmpty()) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Phone number is required.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "SMS OTP sent to " + phone);
        response.put("demoCode", "8821");

        return ResponseEntity.ok(response);
    }
}