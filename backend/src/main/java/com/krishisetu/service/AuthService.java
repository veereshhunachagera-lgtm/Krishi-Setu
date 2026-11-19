package com.krishisetu.service;

import com.krishisetu.dto.AuthRequest;
import com.krishisetu.dto.AuthResponse;
import com.krishisetu.dto.RegisterRequest;
import com.krishisetu.dto.UserSummaryDto;
import com.krishisetu.entity.Role;
import com.krishisetu.entity.User;
import com.krishisetu.exception.BadRequestException;
import com.krishisetu.exception.ResourceNotFoundException;
import com.krishisetu.exception.UnauthorizedException;
import com.krishisetu.repository.UserRepository;
import com.krishisetu.security.JwtService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final NotificationService notificationService;

    public AuthService(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService,
        NotificationService notificationService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.notificationService = notificationService;
    }

    @Transactional
    public AuthResponse registerFarmer(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new BadRequestException("An account with this email already exists.");
        }

        String lang = "kn".equalsIgnoreCase(request.preferredLanguage()) ? "kn" : "en";
        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(request.email().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(Role.FARMER);
        user.setPreferredLanguage(lang);
        user.setOnboardingCompleted(false);

        user = userRepository.save(user);
        notificationService.createNotification(
            user,
            "notifications.items.accountCreatedTitle",
            "notifications.items.accountCreatedMessage",
            "ACCOUNT"
        );

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, toSummary(user));
    }

    public AuthResponse loginFarmer(AuthRequest request) {
        User user = authenticate(request.email(), request.password());
        if (user.getRole() != Role.FARMER) {
            throw new AccessDeniedException("Please use the administrator portal for admin accounts.");
        }
        return new AuthResponse(jwtService.generateToken(user), toSummary(user));
    }

    public AuthResponse loginAdmin(AuthRequest request) {
        User user = authenticate(request.email(), request.password());
        if (user.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Administrator privileges required.");
        }
        return new AuthResponse(jwtService.generateToken(user), toSummary(user));
    }

    public UserSummaryDto getCurrentUser(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        return toSummary(user);
    }

    @Transactional
    public UserSummaryDto updateLanguage(UUID userId, String preferredLanguage) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        user.setPreferredLanguage(preferredLanguage);
        user = userRepository.save(user);
        return toSummary(user);
    }

    private User authenticate(String email, String rawPassword) {
        User user = userRepository.findByEmailIgnoreCase(email.trim())
            .orElseThrow(() -> new UnauthorizedException("Invalid email or password."));
        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password.");
        }
        if (!user.isActive()) {
            throw new AccessDeniedException("This account has been deactivated by an administrator.");
        }
        return user;
    }

    public UserSummaryDto toSummary(User user) {
        return new UserSummaryDto(
            user.getId(),
            user.getFullName(),
            user.getEmail(),
            user.getRole(),
            user.getPreferredLanguage(),
            user.isOnboardingCompleted()
        );
    }
}
