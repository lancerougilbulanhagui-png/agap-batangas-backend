package com.agap.backend.report;

import com.agap.backend.device.BannedDeviceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ReportControllerTest {
    private static final String CITIZEN_ID = "17450fc2-9738-43db-a632-a9dfbd24992a";
    private static final String OTHER_CITIZEN_ID = "24dc490e-bf00-44c9-abf4-6658ed8eb121";
    private static final String ADMIN_ID = "7e8eea0a-11fc-4745-aef5-86dafcd05dd5";
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
                        .with(user(CITIZEN_ID).roles("USER"))
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

        mockMvc.perform(get("/api/reports").with(user(CITIZEN_ID).roles("USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id", is(id)))
                .andExpect(jsonPath("$[0].device_id").doesNotExist())
                .andExpect(jsonPath("$[0].auth_user_id").doesNotExist());

        mockMvc.perform(get("/api/reports").with(user(OTHER_CITIZEN_ID).roles("USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        mockMvc.perform(put("/api/admin/reports/{id}/status", id)
                        .with(user(ADMIN_ID).roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"APPROVED","notice_text":"Response team notified"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("APPROVED")))
                .andExpect(jsonPath("$.notice_text", is("Response team notified")));

        mockMvc.perform(get("/api/reports")
                        .with(user(OTHER_CITIZEN_ID).roles("USER"))
                        .param("status", "APPROVED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id", is(id)))
                .andExpect(jsonPath("$[0].device_id").doesNotExist());
    }

    @Test
    void rejectsReportsMissingRequiredFields() throws Exception {
        mockMvc.perform(post("/api/reports")
                        .with(user(CITIZEN_ID).roles("USER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"device_id":"device-123","location":"Batangas City"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void requiresAuthenticationAndProtectsAdminRoutes() throws Exception {
        mockMvc.perform(get("/api/reports"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/admin/session")
                        .with(user(CITIZEN_ID).roles("USER")))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/session")
                        .with(user(ADMIN_ID).roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authorized", is(true)));
    }
}
