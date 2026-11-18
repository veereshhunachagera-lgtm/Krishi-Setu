package com.krishisetu.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.krishisetu.dto.AgriServicesDtos.*;
import com.krishisetu.entity.AgriServiceProvider;
import com.krishisetu.entity.EquipmentBookingRequest;
import com.krishisetu.entity.EquipmentListing;
import com.krishisetu.entity.FarmerProfile;
import com.krishisetu.entity.User;
import com.krishisetu.exception.BadRequestException;
import com.krishisetu.exception.ResourceNotFoundException;
import com.krishisetu.repository.AgriServiceProviderRepository;
import com.krishisetu.repository.EquipmentBookingRequestRepository;
import com.krishisetu.repository.EquipmentListingRepository;
import com.krishisetu.repository.FarmerProfileRepository;
import com.krishisetu.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class AgriServicesService {

    private static final Set<String> NON_LAB_TYPES = Set.of(
        "COLD_STORAGE",
        "MANDI_APMC",
        "CUSTOM_HIRING_CENTRE",
        "INPUT_SEED_CENTRE",
        "EXTENSION_BANK"
    );

    private static final List<SoilTestingChecklistItemDto> CHECKLIST = List.of(
        new SoilTestingChecklistItemDto(
            1,
            "Representative Composite Sampling",
            "ಪ್ರಾತಿನಿಧಿಕ ಮಣ್ಣಿನ ಮಾದರಿ ಸಂಗ್ರಹಣೆ",
            "Collect 6 to 8 V-shaped sub-samples at 15 cm (6 inch) depth in a zig-zag pattern across a uniform field. Avoid bunds, channels, and compost heaps.",
            "ಸಮಾನವಾದ ಹೊಲದಲ್ಲಿ 15 ಸೆಂ.ಮೀ ಆಳದಿಂದ 6 ರಿಂದ 8 ಮಣ್ಣಿನ ಮಾದರಿಗಳನ್ನು ಸಂಗ್ರಹಿಸಿ. ಬದುಗಳು ಮತ್ತು ಗೊಬ್ಬರದ ರಾಶಿಯ ಬಳಿ ಮಾದರಿ ತೆಗೆಯಬೇಡಿ."
        ),
        new SoilTestingChecklistItemDto(
            2,
            "Shade-Dry, Mix & Pack ~500 g",
            "ನೆರಳಿನಲ್ಲಿ ಒಣಗಿಸಿ 500 ಗ್ರಾಂ ಪ್ಯಾಕ್ ಮಾಡಿ",
            "Air-dry soil in shade, mix thoroughly, quarter down to ~500 g, and pack in a clean labeled bag.",
            "ಮಣ್ಣನ್ನು ನೆರಳಿನಲ್ಲಿ ಒಣಗಿಸಿ, ಚೆನ್ನಾಗಿ ಮಿಶ್ರಣ ಮಾಡಿ ಸುಮಾರು 500 ಗ್ರಾಂ ಮಣ್ಣನ್ನು ಶುದ್ಧ ಚೀಲದಲ್ಲಿ ಕಟ್ಟಿ."
        ),
        new SoilTestingChecklistItemDto(
            3,
            "Required Plot & Farmer Details",
            "ಅಗತ್ಯವಿರುವ ಜಮೀನು ಮತ್ತು ರೈತರ ವಿವರಗಳು",
            "Carry your Survey / RTC (Pahani) number, Aadhaar, active mobile number, field area, irrigation source, previous crop, and next planned crop.",
            "ಸರ್ವೆ / ಆರ್‌ಟಿಸಿ ಸಂಖ್ಯೆ, ಆಧಾರ್, ಮೊಬೈಲ್ ಸಂಖ್ಯೆ, ಎಕರೆ ವಿಸ್ತೀರ್ಣ, ನೀರಾವರಿ ಮೂಲ ಮತ್ತು ಬೆಳೆ ವಿವರಗಳನ್ನು ತೆಗೆದುಕೊಂಡು ಹೋಗಿ."
        ),
        new SoilTestingChecklistItemDto(
            4,
            "Testing Lead Time & Profile Update",
            "ಪರೀಕ್ಷಾ ಸಮಯ ಮತ್ತು ಪ್ರೊಫೈಲ್ ನವೀಕರಣ",
            "District Soil Testing Labs and KVKs typically issue NPK and pH reports in 7–14 working days. Enter those values into KrishiSetu once ready.",
            "ಜಿಲ್ಲಾ ಮಣ್ಣು ಪರೀಕ್ಷಾ ಕೇಂದ್ರಗಳು ಮತ್ತು ಕೆವಿಕೆಗಳು ಸಾಮಾನ್ಯವಾಗಿ 7–14 ದಿನಗಳಲ್ಲಿ ವರದಿ ನೀಡುತ್ತವೆ. ವರದಿ ಬಂದ ನಂತರ ಕೃಷಿಸೇತುವಿನಲ್ಲಿ ನಮೂದಿಸಿ."
        )
    );

    private final AgriServiceProviderRepository providerRepository;
    private final EquipmentListingRepository equipmentRepository;
    private final EquipmentBookingRequestRepository bookingRepository;
    private final FarmerProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public AgriServicesService(
        AgriServiceProviderRepository providerRepository,
        EquipmentListingRepository equipmentRepository,
        EquipmentBookingRequestRepository bookingRepository,
        FarmerProfileRepository profileRepository,
        UserRepository userRepository,
        ObjectMapper objectMapper
    ) {
        this.providerRepository = providerRepository;
        this.equipmentRepository = equipmentRepository;
        this.bookingRepository = bookingRepository;
        this.profileRepository = profileRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedDefaultDirectoriesIfEmpty() {
        if (providerRepository.count() == 0) {
            seedProvider(
                "kvk-mandya-vcfarm", "SOIL_LAB_KVK",
                "ICAR-Krishi Vigyan Kendra, Mandya (V.C. Farm)",
                "ಐಸಿಎಆರ್-ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರ, ಮಂಡ್ಯ (ವಿ.ಸಿ. ಫಾರ್ಮ್)",
                "Karnataka", "Mandya",
                "V.C. Farm Campus, Mandya District, Karnataka 571405 (UAS Bengaluru Jurisdiction)",
                "ವಿ.ಸಿ. ಫಾರ್ಮ್ ಆವರಣ, ಮಂಡ್ಯ ಜಿಲ್ಲೆ, ಕರ್ನಾಟಕ 571405",
                "https://kvk.icar.gov.in/",
                List.of("Soil Health Card NPK & pH Testing", "Crop Advisory", "Seed Demonstrations"),
                List.of("ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಕಾರ್ಡ್ NPK ಮತ್ತು pH ಪರೀಕ್ಷೆ", "ಬೆಳೆ ಸಲಹೆ"),
                12.5678, 76.8261, true, "VERIFIED_DIRECTORY",
                "ICAR KVK Portal & UAS Bengaluru"
            );
            seedProvider(
                "kvk-dharwad-uas", "SOIL_LAB_KVK",
                "ICAR-Krishi Vigyan Kendra, Dharwad (Saidapur Farm)",
                "ಐಸಿಎಆರ್-ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರ, ಧಾರವಾಡ",
                "Karnataka", "Dharwad",
                "Saidapur Farm, UAS Dharwad Campus, Dharwad, Karnataka 580005",
                "ಸೈದಾಪುರ ಫಾರ್ಮ್, ಕೃಷಿ ವಿವಿ ಆವರಣ, ಧಾರವಾಡ 580005",
                "https://kvk.icar.gov.in/",
                List.of("Black Soil & Micronutrient Analysis", "Cotton & Pulse IPM Advisory"),
                List.of("ಕಪ್ಪು ಮಣ್ಣು ಮತ್ತು ಸೂಕ್ಷ್ಮ ಪೋಷಕಾಂಶ ಪರೀಕ್ಷೆ"),
                15.4892, 74.9838, true, "VERIFIED_DIRECTORY",
                "ICAR KVK Portal & UAS Dharwad"
            );
            seedProvider(
                "apmc-mandya-yard", "MANDI_APMC",
                "Mandya APMC Market Yard",
                "ಮಂಡ್ಯ ಎಪಿಎಂಸಿ ಮಾರುಕಟ್ಟೆ ಪ್ರಾಂಗಣ",
                "Karnataka", "Mandya",
                "APMC Market Road, Mandya, Karnataka 571401",
                "ಎಪಿಎಂಸಿ ಮಾರುಕಟ್ಟೆ ರಸ್ತೆ, ಮಂಡ್ಯ 571401",
                "https://enam.gov.in/",
                List.of("Regulated Grain & Jaggery Auction", "Agmarknet Reporting"),
                List.of("ನಿಯಂತ್ರಿತ ಧಾನ್ಯ ಮತ್ತು ಬೆಲ್ಲ ಹರಾಜು"),
                12.5236, 76.8952, true, "VERIFIED_DIRECTORY",
                "Karnataka State Agricultural Marketing Board"
            );
            seedProvider(
                "demo-cold-mandya", "COLD_STORAGE",
                "Mandya District Cold Storage Hub (Sample Entry)",
                "ಮಂಡ್ಯ ಜಿಲ್ಲಾ ಶೀತಲ ಗೃಹ ಕೇಂದ್ರ (ಮಾದರಿ ದಾಖಲೆ)",
                "Karnataka", "Mandya",
                "Industrial Estate Area, Maddur-Mandya Corridor (Demonstration Marker)",
                "ಕೈಗಾರಿಕಾ ಪ್ರದೇಶ, ಮದ್ದೂರು-ಮಂಡ್ಯ ರಸ್ತೆ (ಪ್ರಾತ್ಯಕ್ಷಿಕೆ ಮಾದರಿ)",
                null,
                List.of("Multi-commodity Cooling Chambers", "Pre-cooling Staging"),
                List.of("ಬಹು-ಬೆಳೆ ಶೀತಲ ಸಂಗ್ರಹಣೆ"),
                12.5484, 76.9722, false, "DEMONSTRATION_SAMPLE",
                "KrishiSetu Demonstration Directory (Admin verification required)"
            );
        }

        if (equipmentRepository.count() == 0) {
            seedEquipment(
                "chc-tractor-45hp-mandya", "TRACTOR",
                "45–50 HP Agricultural Tractor with 7-Tyne Cultivator",
                "45–50 ಎಚ್‌ಪಿ ಕೃಷಿ ಟ್ರ್ಯಾಕ್ಟರ್ (ಕಲ್ಟಿವೇಟರ್ ಸಹಿತ)",
                "Maddur Hobli Farmers CHC (Demonstration Listing)",
                "ಮದ್ದೂರು ಹೋಬಳಿ ರೈತ ಯಂತ್ರಧಾರೆ (ಪ್ರಾತ್ಯಕ್ಷಿಕೆ ಪಟ್ಟಿ)",
                "Karnataka", "Mandya", "HOUR"
            );
            seedEquipment(
                "chc-combine-harvester-raichur", "HARVESTER",
                "Track-Mounted Paddy Combine Harvester",
                "ಟ್ರ್ಯಾಕ್ ಆಧಾರಿತ ಭತ್ತದ ಕೊಯ್ಲು ಯಂತ್ರ (ಹಾರ್ವೆಸ್ಟರ್)",
                "Tungabhadra Command CHC Hub (Demonstration Listing)",
                "ತುಂಗಭದ್ರಾ ಅಚ್ಚುಕಟ್ಟು ಯಂತ್ರಧಾರೆ (ಪ್ರಾತ್ಯಕ್ಷಿಕೆ ಪಟ್ಟಿ)",
                "Karnataka", "Raichur", "HOUR"
            );
        }
    }

    public SoilLabsResponse searchSoilLabs(String state, String district, String q) {
        List<AgriServiceProvider> allLabs = providerRepository.findByActiveTrueOrderByNameEnAsc().stream()
            .filter(p -> "SOIL_LAB_KVK".equalsIgnoreCase(p.getServiceType()))
            .toList();

        List<ServiceProviderDto> filtered = filterProviders(allLabs, state, district, q);
        List<String> states = allLabs.stream().map(AgriServiceProvider::getState).distinct().sorted().toList();
        List<String> districts = allLabs.stream().map(AgriServiceProvider::getDistrict).distinct().sorted().toList();

        return new SoilLabsResponse(filtered, CHECKLIST, states, districts);
    }

    public DirectoryResponse searchDirectory(String serviceType, String state, String district, String q) {
        String normalizedType = serviceType != null ? serviceType.trim().toUpperCase(Locale.ROOT) : "";
        List<AgriServiceProvider> allDirectory = providerRepository.findByActiveTrueOrderByNameEnAsc().stream()
            .filter(p -> NON_LAB_TYPES.contains(p.getServiceType().toUpperCase(Locale.ROOT)))
            .toList();

        List<AgriServiceProvider> typeFiltered = (!normalizedType.isBlank() && !"ALL".equals(normalizedType) && NON_LAB_TYPES.contains(normalizedType))
            ? allDirectory.stream().filter(p -> p.getServiceType().equalsIgnoreCase(normalizedType)).toList()
            : allDirectory;

        List<ServiceProviderDto> filtered = filterProviders(typeFiltered, state, district, q);
        List<String> states = allDirectory.stream().map(AgriServiceProvider::getState).distinct().sorted().toList();
        List<String> districts = allDirectory.stream().map(AgriServiceProvider::getDistrict).distinct().sorted().toList();

        return new DirectoryResponse(filtered, states, districts);
    }

    public EquipmentCatalogResponse searchEquipment(String category, String state, String district, String q) {
        List<EquipmentListing> all = equipmentRepository.findByActiveTrueOrderByEquipmentNameEnAsc();
        String cat = category != null ? category.trim().toUpperCase(Locale.ROOT) : "";
        String st = state != null ? state.trim().toLowerCase(Locale.ROOT) : "";
        String dist = district != null ? district.trim().toLowerCase(Locale.ROOT) : "";
        String query = q != null ? q.trim().toLowerCase(Locale.ROOT) : "";

        List<EquipmentListingDto> filtered = all.stream()
            .filter(e -> cat.isBlank() || "ALL".equals(cat) || e.getCategory().equalsIgnoreCase(cat))
            .filter(e -> st.isBlank() || e.getState().toLowerCase(Locale.ROOT).contains(st))
            .filter(e -> dist.isBlank() || e.getDistrict().toLowerCase(Locale.ROOT).contains(dist))
            .filter(e -> query.isBlank() || (e.getEquipmentNameEn() + " " + e.getEquipmentNameKn() + " " + e.getProviderNameEn() + " " + e.getDistrict()).toLowerCase(Locale.ROOT).contains(query))
            .sorted(Comparator.comparing(e -> !"VERIFIED_DIRECTORY".equals(e.getVerificationStatus())))
            .map(this::toEquipmentDto)
            .toList();

        List<String> states = all.stream().map(EquipmentListing::getState).distinct().sorted().toList();
        List<String> districts = all.stream().map(EquipmentListing::getDistrict).distinct().sorted().toList();
        return new EquipmentCatalogResponse(filtered, states, districts);
    }

    public List<BookingRequestDto> getFarmerBookings(UUID userId) {
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
            .map(this::toBookingDto)
            .toList();
    }

    @Transactional
    public BookingRequestDto createBookingRequest(UUID userId, BookingCreateRequest req) {
        String unit = req.durationUnit().trim().toUpperCase(Locale.ROOT);
        if (!Set.of("HOURS", "ACRES", "DAYS").contains(unit)) {
            throw new BadRequestException("Duration unit must be HOURS, ACRES, or DAYS.");
        }
        String digits = req.contactPhone().replaceAll("\\D", "");
        if (digits.length() < 10) {
            throw new BadRequestException("Enter a valid 10-digit callback mobile number.");
        }

        EquipmentListing listing = equipmentRepository.findById(req.equipmentId())
            .filter(EquipmentListing::isActive)
            .orElseThrow(() -> new ResourceNotFoundException("Selected equipment listing not found."));

        String farmerName = profileRepository.findByUserId(userId)
            .map(FarmerProfile::getFarmerName)
            .orElseGet(() -> userRepository.findById(userId).map(User::getFullName).orElse("Farmer"));

        EquipmentBookingRequest entity = new EquipmentBookingRequest();
        entity.setUserId(userId);
        entity.setFarmerName(farmerName);
        entity.setEquipmentId(listing.getId());
        entity.setEquipmentNameEn(listing.getEquipmentNameEn());
        entity.setEquipmentNameKn(listing.getEquipmentNameKn());
        entity.setProviderNameEn(listing.getProviderNameEn());
        entity.setDistrict(listing.getDistrict());
        entity.setState(listing.getState());
        entity.setRequestedDate(req.requestedDate().trim());
        entity.setDurationValue(req.durationValue());
        entity.setDurationUnit(unit);
        entity.setContactPhone(req.contactPhone().trim());
        entity.setNotes(req.notes() != null && !req.notes().isBlank() ? req.notes().trim() : null);
        entity.setStatus("REQUESTED");
        entity.setConfirmationNote("Logged as a booking request only — not a confirmed reservation. Wait for provider or CHC confirmation by phone.");

        return toBookingDto(bookingRepository.save(entity));
    }

    @Transactional
    public BookingRequestDto cancelFarmerBooking(UUID userId, UUID bookingId) {
        EquipmentBookingRequest entity = bookingRepository.findByIdAndUserId(bookingId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Equipment booking request not found."));
        if ("COMPLETED".equals(entity.getStatus()) || "CANCELLED".equals(entity.getStatus())) {
            throw new BadRequestException("Completed or cancelled booking requests cannot be cancelled.");
        }
        entity.setStatus("CANCELLED");
        return toBookingDto(bookingRepository.save(entity));
    }

    public List<ServiceProviderDto> listAllProvidersAdmin() {
        return providerRepository.findAll().stream().map(this::toProviderDto).toList();
    }

    @Transactional
    public ServiceProviderDto createProviderAdmin(AdminServiceProviderCreateRequest req) {
        AgriServiceProvider entity = new AgriServiceProvider();
        String code = (req.providerCode() != null && !req.providerCode().isBlank())
            ? req.providerCode().trim().toLowerCase(Locale.ROOT)
            : "admin-" + UUID.randomUUID().toString().substring(0, 8);
        entity.setProviderCode(code);
        entity.setServiceType(req.serviceType().trim().toUpperCase(Locale.ROOT));
        entity.setNameEn(req.nameEn().trim());
        entity.setNameKn(req.nameKn() != null && !req.nameKn().isBlank() ? req.nameKn().trim() : req.nameEn().trim());
        entity.setState(req.state().trim());
        entity.setDistrict(req.district().trim());
        entity.setAddressEn(req.addressEn().trim());
        entity.setAddressKn(req.addressKn() != null && !req.addressKn().isBlank() ? req.addressKn().trim() : req.addressEn().trim());
        entity.setContactPhone(trimOrNull(req.contactPhone()));
        entity.setContactEmail(trimOrNull(req.contactEmail()));
        entity.setWebsiteUrl(trimOrNull(req.websiteUrl()));
        entity.setServicesOfferedEnJson(toJson(req.servicesOfferedEn() != null ? req.servicesOfferedEn() : List.of()));
        entity.setServicesOfferedKnJson(toJson(req.servicesOfferedKn() != null ? req.servicesOfferedKn() : List.of()));
        entity.setCapacityNoteEn(trimOrNull(req.capacityNoteEn()));
        entity.setCapacityNoteKn(trimOrNull(req.capacityNoteKn()));
        entity.setLatitude(req.latitude());
        entity.setLongitude(req.longitude());
        entity.setCoordinatesVerified(req.latitude() != null && req.longitude() != null && req.coordinatesVerified());
        entity.setVerificationStatus("VERIFIED_DIRECTORY".equals(req.verificationStatus()) ? "VERIFIED_DIRECTORY" : "DEMONSTRATION_SAMPLE");
        entity.setSourceReference(req.sourceReference() != null && !req.sourceReference().isBlank() ? req.sourceReference().trim() : "Admin Directory Entry");
        entity.setActive(true);
        return toProviderDto(providerRepository.save(entity));
    }

    @Transactional
    public void deleteProviderAdmin(UUID id) {
        if (!providerRepository.existsById(id)) {
            throw new ResourceNotFoundException("Service provider entry not found.");
        }
        providerRepository.deleteById(id);
    }

    public List<EquipmentListingDto> listAllEquipmentAdmin() {
        return equipmentRepository.findAll().stream().map(this::toEquipmentDto).toList();
    }

    @Transactional
    public EquipmentListingDto createEquipmentAdmin(AdminEquipmentCreateRequest req) {
        String cat = req.category().trim().toUpperCase(Locale.ROOT);
        if (!Set.of("TRACTOR", "HARVESTER", "OTHER").contains(cat)) {
            throw new BadRequestException("Category must be TRACTOR, HARVESTER, or OTHER.");
        }
        EquipmentListing entity = new EquipmentListing();
        entity.setListingCode("eq-" + UUID.randomUUID().toString().substring(0, 8));
        entity.setCategory(cat);
        entity.setEquipmentNameEn(req.equipmentNameEn().trim());
        entity.setEquipmentNameKn(req.equipmentNameKn() != null && !req.equipmentNameKn().isBlank() ? req.equipmentNameKn().trim() : req.equipmentNameEn().trim());
        entity.setModelOrSpecEn(req.modelOrSpecEn() != null && !req.modelOrSpecEn().isBlank() ? req.modelOrSpecEn().trim() : "Standard farm implement");
        entity.setModelOrSpecKn(req.modelOrSpecKn() != null && !req.modelOrSpecKn().isBlank() ? req.modelOrSpecKn().trim() : "ಕೃಷಿ ಯಂತ್ರೋಪಕರಣ");
        entity.setProviderNameEn(req.providerNameEn().trim());
        entity.setProviderNameKn(req.providerNameKn() != null && !req.providerNameKn().isBlank() ? req.providerNameKn().trim() : req.providerNameEn().trim());
        entity.setState(req.state().trim());
        entity.setDistrict(req.district().trim());
        entity.setContactPhone(trimOrNull(req.contactPhone()));
        boolean hasPositiveRate = req.rateInr() != null && req.rateInr().doubleValue() > 0;
        entity.setRateInr(hasPositiveRate ? req.rateInr() : null);
        entity.setRateUnit(Set.of("HOUR", "ACRE", "DAY").contains(String.valueOf(req.rateUnit()).toUpperCase(Locale.ROOT)) ? req.rateUnit().toUpperCase(Locale.ROOT) : "HOUR");
        entity.setRateVerified(hasPositiveRate && req.rateVerified());
        entity.setAvailabilityStatus(Set.of("AVAILABLE", "SEASONAL_DEMAND").contains(String.valueOf(req.availabilityStatus()).toUpperCase(Locale.ROOT)) ? req.availabilityStatus().toUpperCase(Locale.ROOT) : "UNVERIFIED");
        entity.setVerificationStatus("VERIFIED_DIRECTORY".equals(req.verificationStatus()) ? "VERIFIED_DIRECTORY" : "DEMONSTRATION_SAMPLE");
        entity.setSourceReference(req.sourceReference() != null && !req.sourceReference().isBlank() ? req.sourceReference().trim() : "Admin Verified CHC Listing");
        entity.setActive(true);
        return toEquipmentDto(equipmentRepository.save(entity));
    }

    @Transactional
    public void deleteEquipmentAdmin(UUID id) {
        if (!equipmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Equipment listing not found.");
        }
        equipmentRepository.deleteById(id);
    }

    public List<BookingRequestDto> listAllBookingsAdmin() {
        return bookingRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toBookingDto).toList();
    }

    @Transactional
    public BookingRequestDto updateBookingStatusAdmin(UUID id, AdminBookingStatusUpdateRequest req) {
        String st = req.status().trim().toUpperCase(Locale.ROOT);
        if (!Set.of("REQUESTED", "REVIEWING", "FORWARDED_TO_PROVIDER", "COMPLETED", "CANCELLED").contains(st)) {
            throw new BadRequestException("Invalid booking request status.");
        }
        EquipmentBookingRequest entity = bookingRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Booking request not found."));
        entity.setStatus(st);
        if (req.adminNote() != null && !req.adminNote().isBlank()) {
            entity.setAdminNote(req.adminNote().trim());
        }
        return toBookingDto(bookingRepository.save(entity));
    }

    private List<ServiceProviderDto> filterProviders(
        List<AgriServiceProvider> source,
        String state,
        String district,
        String q
    ) {
        String st = state != null ? state.trim().toLowerCase(Locale.ROOT) : "";
        String dist = district != null ? district.trim().toLowerCase(Locale.ROOT) : "";
        String query = q != null ? q.trim().toLowerCase(Locale.ROOT) : "";

        return source.stream()
            .filter(p -> st.isBlank() || p.getState().toLowerCase(Locale.ROOT).contains(st))
            .filter(p -> dist.isBlank() || p.getDistrict().toLowerCase(Locale.ROOT).contains(dist))
            .filter(p -> query.isBlank() || (p.getNameEn() + " " + p.getNameKn() + " " + p.getDistrict() + " " + p.getAddressEn()).toLowerCase(Locale.ROOT).contains(query))
            .sorted(Comparator.comparing(p -> !"VERIFIED_DIRECTORY".equals(p.getVerificationStatus())))
            .map(this::toProviderDto)
            .toList();
    }

    private ServiceProviderDto toProviderDto(AgriServiceProvider p) {
        return new ServiceProviderDto(
            p.getId(),
            p.getProviderCode(),
            p.getServiceType(),
            p.getNameEn(),
            p.getNameKn(),
            p.getState(),
            p.getDistrict(),
            p.getAddressEn(),
            p.getAddressKn(),
            p.getContactPhone(),
            p.getContactEmail(),
            p.getWebsiteUrl(),
            parseList(p.getServicesOfferedEnJson()),
            parseList(p.getServicesOfferedKnJson()),
            p.getCapacityNoteEn(),
            p.getCapacityNoteKn(),
            p.getLatitude(),
            p.getLongitude(),
            p.isCoordinatesVerified(),
            p.getVerificationStatus(),
            p.getSourceReference(),
            p.isActive()
        );
    }

    private EquipmentListingDto toEquipmentDto(EquipmentListing e) {
        return new EquipmentListingDto(
            e.getId(),
            e.getListingCode(),
            e.getCategory(),
            e.getEquipmentNameEn(),
            e.getEquipmentNameKn(),
            e.getModelOrSpecEn(),
            e.getModelOrSpecKn(),
            e.getProviderNameEn(),
            e.getProviderNameKn(),
            e.getState(),
            e.getDistrict(),
            e.getContactPhone(),
            e.getRateInr(),
            e.getRateUnit(),
            e.isRateVerified(),
            e.getAvailabilityStatus(),
            e.getVerificationStatus(),
            e.getSourceReference(),
            e.isActive()
        );
    }

    private BookingRequestDto toBookingDto(EquipmentBookingRequest b) {
        return new BookingRequestDto(
            b.getId(),
            b.getUserId(),
            b.getFarmerName(),
            b.getEquipmentId(),
            b.getEquipmentNameEn(),
            b.getEquipmentNameKn(),
            b.getProviderNameEn(),
            b.getDistrict(),
            b.getState(),
            b.getRequestedDate(),
            b.getDurationValue(),
            b.getDurationUnit(),
            b.getContactPhone(),
            b.getNotes(),
            b.getStatus(),
            b.getConfirmationNote(),
            b.getAdminNote(),
            b.getCreatedAt(),
            b.getUpdatedAt()
        );
    }

    private List<String> parseList(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception ex) {
            return List.of();
        }
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            return "[]";
        }
    }

    private String trimOrNull(String val) {
        return val != null && !val.isBlank() ? val.trim() : null;
    }

    private void seedProvider(
        String code, String type, String nameEn, String nameKn,
        String state, String district, String addrEn, String addrKn,
        String website, List<String> servicesEn, List<String> servicesKn,
        double lat, double lon, boolean coordsVerified, String tier, String source
    ) {
        AgriServiceProvider p = new AgriServiceProvider();
        p.setProviderCode(code);
        p.setServiceType(type);
        p.setNameEn(nameEn);
        p.setNameKn(nameKn);
        p.setState(state);
        p.setDistrict(district);
        p.setAddressEn(addrEn);
        p.setAddressKn(addrKn);
        p.setWebsiteUrl(website);
        p.setServicesOfferedEnJson(toJson(servicesEn));
        p.setServicesOfferedKnJson(toJson(servicesKn));
        p.setLatitude(lat);
        p.setLongitude(lon);
        p.setCoordinatesVerified(coordsVerified);
        p.setVerificationStatus(tier);
        p.setSourceReference(source);
        p.setActive(true);
        providerRepository.save(p);
    }

    private void seedEquipment(
        String code, String cat, String nameEn, String nameKn,
        String providerEn, String providerKn, String state, String district, String unit
    ) {
        EquipmentListing e = new EquipmentListing();
        e.setListingCode(code);
        e.setCategory(cat);
        e.setEquipmentNameEn(nameEn);
        e.setEquipmentNameKn(nameKn);
        e.setProviderNameEn(providerEn);
        e.setProviderNameKn(providerKn);
        e.setState(state);
        e.setDistrict(district);
        e.setRateUnit(unit);
        e.setRateVerified(false);
        e.setAvailabilityStatus("UNVERIFIED");
        e.setVerificationStatus("DEMONSTRATION_SAMPLE");
        e.setSourceReference("Demonstration listing — Admin can verify local CHC tariff");
        e.setActive(true);
        equipmentRepository.save(e);
    }
}
