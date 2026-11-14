package com.krishisetu.controller;

import com.krishisetu.dto.AuthRequest;
import com.krishisetu.dto.AuthResponse;
import com.krishisetu.dto.LanguageUpdateRequest;
import com.krishisetu.dto.RegisterRequest;
import com.krishisetu.dto.UserSummaryDto;
import com.krishisetu.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerFarmer(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> loginFarmer(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.loginFarmer(request));
    }

    @PostMapping("/admin/login")
    public ResponseEntity<AuthResponse> loginAdmin(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.loginAdmin(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserSummaryDto> currentUser(@AuthenticationPrincipal UserDetails principal) {
        UUID userId = UUID.fromString(principal.getUsername());
        return ResponseEntity.ok(authService.getCurrentUser(userId));
    }

    @PatchMapping("/language")
    public ResponseEntity<UserSummaryDto> updateLanguage(
        @AuthenticationPrincipal UserDetails principal,
        @Valid @RequestBody LanguageUpdateRequest request
    ) {
        UUID userId = UUID.fromString(principal.getUsername());
        return ResponseEntity.ok(authService.updateLanguage(userId, request.preferredLanguage()));
    }
}
