package com.krishisetu.config;

import com.krishisetu.entity.FarmerProfile;
import com.krishisetu.entity.Notification;
import com.krishisetu.entity.Role;
import com.krishisetu.entity.SoilReport;
import com.krishisetu.entity.User;
import com.krishisetu.repository.FarmerProfileRepository;
import com.krishisetu.repository.NotificationRepository;
import com.krishisetu.repository.UserRepository;
import com.krishisetu.service.CropDatasetImportService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final NotificationRepository notificationRepository;
    private final CropDatasetImportService cropDatasetImportService;
    private final PasswordEncoder passwordEncoder;
    private final boolean seedEnabled;

    public DataInitializer(
        UserRepository userRepository,
        FarmerProfileRepository farmerProfileRepository,
        NotificationRepository notificationRepository,
        CropDatasetImportService cropDatasetImportService,
        PasswordEncoder passwordEncoder,
        @Value("${krishisetu.seed.enabled:true}") boolean seedEnabled
    ) {
        this.userRepository = userRepository;
        this.farmerProfileRepository = farmerProfileRepository;
        this.notificationRepository = notificationRepository;
        this.cropDatasetImportService = cropDatasetImportService;
        this.passwordEncoder = passwordEncoder;
        this.seedEnabled = seedEnabled;
    }

    @Override
    public void run(String... args) {
        cropDatasetImportService.importSeedDatasetIfEmpty();

        if (!seedEnabled) {
            return;
        }

        if (!userRepository.existsByEmailIgnoreCase("admin@krishisetu.in")) {
            User admin = new User();
            admin.setFullName("KrishiSetu State Admin");
            admin.setEmail("admin@krishisetu.in");
            admin.setPasswordHash(passwordEncoder.encode("Admin@123"));
            admin.setRole(Role.ADMIN);
            admin.setPreferredLanguage("en");
            admin.setOnboardingCompleted(true);
            userRepository.save(admin);
        }

        if (!userRepository.existsByEmailIgnoreCase("ramesh.farmer@krishisetu.in")) {
            User farmer = new User();
            farmer.setFullName("Ramesh Gowda");
            farmer.setEmail("ramesh.farmer@krishisetu.in");
            farmer.setPasswordHash(passwordEncoder.encode("Farmer@123"));
            farmer.setRole(Role.FARMER);
            farmer.setPreferredLanguage("en");
            farmer.setOnboardingCompleted(true);
            farmer = userRepository.save(farmer);

            FarmerProfile profile = new FarmerProfile();
            profile.setUser(farmer);
            profile.setHasSoilReport(true);
            profile.setFarmerName("Ramesh Gowda");
            profile.setState("Karnataka");
            profile.setDistrict("Mandya");
            profile.setVillage("Maddur");
            profile.setLandSize(new BigDecimal("3.50"));
            profile.setLandUnit("ACRES");
            profile.setSoilType("RED");
            profile.setIrrigationSource("CANAL");
            profile.setCurrentOrPreviousCrop("Ragi (Finger Millet)");
            profile.setGrowingSeason("KHARIF");

            SoilReport report = new SoilReport();
            report.setFarmerProfile(profile);
            report.setNitrogenKgPerHa(new BigDecimal("245.0"));
            report.setPhosphorusKgPerHa(new BigDecimal("28.5"));
            report.setPotassiumKgPerHa(new BigDecimal("190.0"));
            report.setPhLevel(new BigDecimal("6.4"));
            report.setLabName("Mandya Krishi Vigyan Kendra");
            report.setSampleDate("2026-09-18");
            profile.setSoilReport(report);
            farmerProfileRepository.save(profile);

            Notification welcome = new Notification();
            welcome.setUser(farmer);
            welcome.setTitleKey("notifications.items.welcomeTitle");
            welcome.setMessageKey("notifications.items.welcomeMessage");
            welcome.setCategory("ONBOARDING");
            notificationRepository.save(welcome);
        }
    }
}
