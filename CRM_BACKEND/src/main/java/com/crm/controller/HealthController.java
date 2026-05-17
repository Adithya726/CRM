package com.crm.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Health probe for Electron startup (no auth required).
 */
@RestController
@RequestMapping("/api")
public class HealthController {

    @Autowired(required = false)
    private DataSource dataSource;

    @Autowired
    private Environment environment;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", "UP");
        body.put("profile", environment.getActiveProfiles().length > 0
                ? environment.getActiveProfiles()[0]
                : "default");

        if (dataSource != null) {
            try {
                new JdbcTemplate(dataSource).queryForObject("SELECT 1", Integer.class);
                body.put("database", "UP");
            } catch (Exception ex) {
                body.put("status", "DOWN");
                body.put("database", "DOWN");
                body.put("error", ex.getMessage());
                return ResponseEntity.status(503).body(body);
            }
        }

        return ResponseEntity.ok(body);
    }
}
