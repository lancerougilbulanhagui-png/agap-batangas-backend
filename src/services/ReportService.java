package com.agap.batangas.service;

import com.agap.batangas.model.Report;
import com.agap.batangas.repository.ReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReportService {

    @Autowired
    private ReportRepository reportRepository;

    public List<Report> getAllReports() {
        return reportRepository.findAll();
    }

    public Report saveReport(Report report) {
        return reportRepository.save(report);
    }
}