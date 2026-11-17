package com.krishisetu.dto;

import java.util.List;

public record SmartAlertsResponse(
    String generatedAt,
    String locationLabel,
    String weatherCheckStatus,
    String weatherStatusNoteEn,
    String weatherStatusNoteKn,
    List<SmartAlertItem> alerts,
    String honestyDisclosureEn,
    String honestyDisclosureKn
) {
    public record SmartAlertItem(
        String id,
        String category,
        String severity,
        String verificationLabelEn,
        String verificationLabelKn,
        String titleEn,
        String titleKn,
        String detailEn,
        String detailKn,
        String regionLabel,
        String cropLabel,
        String sourceName,
        String sourceUrl,
        String observedOrValidDate
    ) {}
}
