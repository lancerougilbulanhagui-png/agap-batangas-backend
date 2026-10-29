package com.agap.backend.auth;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
public class SupabaseTokenFilter extends OncePerRequestFilter {
    private final RestClient supabaseAuthClient;
    private final String anonKey;
    private final AdminUserRepository adminUserRepository;

    public SupabaseTokenFilter(
            @Value("${agap.supabase.url}") String supabaseUrl,
            @Value("${agap.supabase.anon-key}") String anonKey,
            AdminUserRepository adminUserRepository) {
        this.supabaseAuthClient = RestClient.builder()
                .baseUrl(supabaseUrl)
                .build();
        this.anonKey = anonKey;
        this.adminUserRepository = adminUserRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String accessToken = authorization.substring("Bearer ".length()).trim();
        if (accessToken.isEmpty()) {
            writeError(response, HttpStatus.UNAUTHORIZED, "A valid Supabase access token is required.");
            return;
        }

        JsonNode user;
        try {
            user = supabaseAuthClient.get()
                    .uri("/auth/v1/user")
                    .header("apikey", anonKey)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().is4xxClientError()) {
                writeError(response, HttpStatus.UNAUTHORIZED, "The Supabase access token is invalid or expired.");
            } else {
                writeError(response, HttpStatus.BAD_GATEWAY, "Supabase authentication is temporarily unavailable.");
            }
            return;
        } catch (ResourceAccessException exception) {
            writeError(response, HttpStatus.BAD_GATEWAY, "Supabase authentication is temporarily unavailable.");
            return;
        }

        if (user == null || user.get("id") == null) {
            writeError(response, HttpStatus.UNAUTHORIZED, "Supabase did not return a valid user.");
            return;
        }

        UUID userId;
        try {
            userId = UUID.fromString(user.get("id").asText());
        } catch (IllegalArgumentException exception) {
            writeError(response, HttpStatus.UNAUTHORIZED, "Supabase returned an invalid user identity.");
            return;
        }

        String authority = adminUserRepository.existsById(userId) ? "ROLE_ADMIN" : "ROLE_USER";
        var authentication = new UsernamePasswordAuthenticationToken(
                userId.toString(), accessToken, AuthorityUtils.createAuthorityList(authority));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        filterChain.doFilter(request, response);
    }

    private void writeError(HttpServletResponse response, HttpStatus status, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"" + message + "\"}");
    }
}
