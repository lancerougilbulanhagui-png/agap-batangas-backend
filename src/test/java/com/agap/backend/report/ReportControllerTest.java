package com.agap.backend.report;

import com.agap.backend.device.BannedDeviceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ReportControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private BannedDeviceRepository bannedDeviceRepository;

    @BeforeEach
    void clearDatabase() {
        reportRepository.deleteAll();
        bannedDeviceRepository.deleteAll();
    }

    @Test
    void createsListsAndUpdatesAReport() throws Exception {
        String reportId = mockMvc.perform(post("/api/reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "category": "FLOODING",
                                  "hazard_type": "FLOODING",
                                  "severity": "HIGH",
                                  "location": "Batangas City",
                                  "coordinates": "13.7565, 121.0583",
                                  "device_id": "device-123",
                                  "description": "Rising water"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ticket_no").exists())
                .andExpect(jsonPath("$.report_type", is("FLOODING")))
                .andExpect(jsonPath("$.status", is("PENDING")))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String id = new com.fasterxml.jackson.databind.ObjectMapper()
                .readTree(reportId)
                .get("id")
                .asText();

        mockMvc.perform(get("/api/reports").param("deviceId", "device-123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id", is(id)));

        mockMvc.perform(put("/api/admin/reports/{id}/status", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"APPROVED","notice_text":"Response team notified"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("APPROVED")))
                .andExpect(jsonPath("$.notice_text", is("Response team notified")));
    }

    @Test
    void rejectsReportsMissingRequiredFields() throws Exception {
        mockMvc.perform(post("/api/reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"device_id":"device-123","location":"Batangas City"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }
}
