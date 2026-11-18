package com.krishisetu.repository;

import com.krishisetu.entity.AgriServiceProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AgriServiceProviderRepository extends JpaRepository<AgriServiceProvider, UUID> {
    List<AgriServiceProvider> findByActiveTrueOrderByNameEnAsc();
    Optional<AgriServiceProvider> findByProviderCodeIgnoreCase(String providerCode);
    boolean existsByProviderCodeIgnoreCase(String providerCode);
}
