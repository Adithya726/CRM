package com.crm.controller;

import com.crm.model.User;
import com.crm.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin("*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    // Register (Operator)
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {

        if (userRepository.existsByUsername(user.getUsername())) {
            return ResponseEntity.badRequest().body("Username already exists");
        }

        user.setRole("OPERATOR");
        user.setApproved(false);

        return ResponseEntity.ok(userRepository.save(user));
    }

    // Login
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User request) {

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.getPassword().equals(request.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        if (!user.isApproved()) {
            throw new RuntimeException("Waiting for admin approval");
        }

        return ResponseEntity.ok(user);
    }
}