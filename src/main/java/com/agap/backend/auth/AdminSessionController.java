package com.agap.backend.auth;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminSessionController {
    @GetMapping("/session")
    public Map<String, Boolean> verifyAdminSession() {
        return Map.of("authorized", true);
    }
}
