package com.krishisetu.integration;

/**
 * Integration boundary package for Phase 2+ external API adapters:
 * - Gemini AI advisory service (server-side only, never exposed to frontend)
 * - Weather forecast integration (e.g., Open-Meteo / IMD)
 * - Mandi & Agmarknet market price feeds
 * - Future SMS OTP / WhatsApp notification gateways
 */
public final class IntegrationGatewayContract {
    private IntegrationGatewayContract() {}
}
