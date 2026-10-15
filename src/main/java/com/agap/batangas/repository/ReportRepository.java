package com.agap.repository;

import com.agap.model.Report;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class ReportRepository {

    private final List<Report> reports = new ArrayList<>();
    private final ConcurrentHashMap<String, Integer> deviceReportCounts = new ConcurrentHashMap<>();

    public Report save(Report report) {
        reports.add(report);
        return report;
    }

    public List<Report> findAll() {
        return new ArrayList<>(reports);
    }

    public int getDeviceReportCount(String deviceId) {
        return deviceReportCounts.getOrDefault(deviceId, 0);
    }

    public void incrementDeviceReportCount(String deviceId) {
        deviceReportCounts.put(deviceId, getDeviceReportCount(deviceId) + 1);
    }
}