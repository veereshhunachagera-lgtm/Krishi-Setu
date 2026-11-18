import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import crypto from 'node:crypto';
import type { CropKnowledgeRecord } from './cropEngine.ts';
import type { PlantProtectionGuideRecord } from './plantHealthEngine.ts';

export type AssistantLanguage = 'en' | 'kn';

export interface AiChatMessageRecord {
  id: string;
  userId: string;
  role: 'USER' | 'ASSISTANT';
  language: AssistantLanguage;
  content: string;
  model: string | null;
  groundedCrops: Array<{
    cropCode: string;
    nameEn: string;
    nameKn: string;
    sourceReference: string;
  }>;
  createdAt: string;
}

export interface AiAssistantStatusResponse {
  configured: boolean;
  provider: string;
  model: string;
  supportedLanguages: AssistantLanguage[];
  freeTierTermsEn: string;
  freeTierTermsKn: string;
  setupInstructionsEn: string[];
  setupInstructionsKn: string[];
  safetyScopeEn: string;
  safetyScopeKn: string;
}

export class AiServiceError extends Error {
  statusCode: number;
  errorCode: string;

  constructor(statusCode: number, errorCode: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

export interface FarmerContextProfile {
  farmerName: string;
  state: string | null;
  district: string | null;
  village: string | null;
  landSize: number | null;
  landUnit: string | null;
  hasSoilReport: boolean;
  soilType: string | null;
  irrigationSource: string | null;
  currentOrPreviousCrop: string | null;
  growingSeason: string | null;
  soilReport: {
    nitrogenKgPerHa: number | null;
    phosphorusKgPerHa: number | null;
    potassiumKgPerHa: number | null;
    phLevel: number | null;
    nitrogenUnknown: boolean;
    phosphorusUnknown: boolean;
    potassiumUnknown: boolean;
    phUnknown: boolean;
  } | null;
}

const DEFAULT_GEMINI_MODEL = 'gemini-4-hydrogen';

function resolveGeminiConfig() {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  const model = (process.env.GEMINI_MODEL || '').trim() || DEFAULT_GEMINI_MODEL;
  return { apiKey, model };
}

export function getAiAssistantStatus(): AiAssistantStatusResponse {
  const { apiKey, model } = resolveGeminiConfig();
  return {
    configured: Boolean(apiKey),
    provider: 'Google Gemini API',
    model,
    supportedLanguages: ['en', 'kn'],
    freeTierTermsEn:
      'Gemini API offers a no-cost tier with strict requests-per-minute and daily token quotas; usage terms apply via Google AI Studio. Requests may fail temporarily when quota limits are reached.',
    freeTierTermsKn:
      'Gemini API ಉಚಿತ ಶ್ರೇಣಿಯು ನಿಗದಿತ ನಿಮಿಷದ ಹಾಗೂ ದೈನಂದಿನ ಮಿತಿಗಳನ್ನು ಹೊಂದಿದೆ. ಕೋಟಾ ಮೀರಿದಾಗ ತಾತ್ಕಾಲಿಕ ಅಡಚಣೆ ಉಂಟಾಗಬಹುದು.',
    setupInstructionsEn: [
      'Obtain a free or billing-enabled Gemini API key from Google AI Studio.',
      'Set GEMINI_API_KEY on the backend server environment (never in frontend code).',
      'Optionally set GEMINI_MODEL (defaults to gemini-4-hydrogen) and restart the backend server.',
    ],
    setupInstructionsKn: [
      'Google AI Studio ದಿಂದ ಉಚಿತ ಅಥವಾ ಪಾವತಿ Gemini API ಕೀ ಪಡೆಯಿರಿ.',
      'ಬ್ಯಾಕ್‌ಎಂಡ್ ಸರ್ವರ್ ಪರಿಸರದಲ್ಲಿ GEMINI_API_KEY ಅನ್ನು ಹೊಂದಿಸಿ (ಫ್ರಂಟ್‌ಎಂಡ್‌ನಲ್ಲಿ ಎಂದಿಗೂ ಹಾಕಬೇಡಿ).',
      'ಅಗತ್ಯವಿದ್ದರೆ GEMINI_MODEL ಹೊಂದಿಸಿ ಬ್ಯಾಕ್‌ಎಂಡ್ ಸರ್ವರ್ ಮರುಪ್ರಾರಂಭಿಸಿ.',
    ],
    safetyScopeEn:
      'Grounded on your saved farm profile and KrishiSetu crop dataset. Does not fabricate live mandi prices, weather forecasts, unverified contacts, or confirmed disease diagnoses.',
    safetyScopeKn:
      'ನಿಮ್ಮ ಕೃಷಿ ಪ್ರೊಫೈಲ್ ಮತ್ತು ಕೃಷಿಸೇತು ಬೆಳೆ ಡೇಟಾಸೆಟ್ ಆಧರಿಸಿ ಉತ್ತರಿಸುತ್ತದೆ. ನಕಲಿ ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು, ಹವಾಮಾನ ಅಥವಾ ರೋಗ ನಿರ್ಣಯಗಳನ್ನು ರಚಿಸುವುದಿಲ್ಲ.',
  };
}

export function selectRelevantKnowledgeContext(
  query: string,
  profile: FarmerContextProfile | null,
  crops: CropKnowledgeRecord[],
  guides: PlantProtectionGuideRecord[],
): {
  matchedCrops: CropKnowledgeRecord[];
  matchedGuides: PlantProtectionGuideRecord[];
} {
  const normalizedQuery = query.toLowerCase();
  const savedCropLower = (profile?.currentOrPreviousCrop || '').toLowerCase();
  const stateLower = (profile?.state || '').toLowerCase();
  const soilUpper = (profile?.soilType || '').toUpperCase();

  const scoredCrops = crops.map((c) => {
    let score = 0;
    if (
      normalizedQuery.includes(c.cropCode.toLowerCase()) ||
      normalizedQuery.includes(c.nameEn.toLowerCase()) ||
      normalizedQuery.includes(c.nameKn.toLowerCase())
    ) {
      score += 10;
    }
    if (
      savedCropLower &&
      (savedCropLower.includes(c.cropCode.toLowerCase()) ||
        savedCropLower.includes(c.nameEn.toLowerCase()))
    ) {
      score += 5;
    }
    if (soilUpper && c.suitableSoils.includes(soilUpper)) {
      score += 2;
    }
    if (stateLower && c.supportedStates.some((s) => s.toLowerCase() === stateLower)) {
      score += 1;
    }
    for (const pest of c.commonPests) {
      if (normalizedQuery.includes(pest.pestNameEn.toLowerCase())) {
        score += 4;
      }
    }
    return { crop: c, score };
  });

  scoredCrops.sort((a, b) => b.score - a.score);
  const matchedCrops = scoredCrops
    .filter((entry) => entry.score > 0)
    .slice(0, 4)
    .map((entry) => entry.crop);

  if (matchedCrops.length === 0 && crops.length > 0) {
    matchedCrops.push(...crops.slice(0, 3));
  }

  const matchedCropCodes = new Set(matchedCrops.map((c) => c.cropCode.toLowerCase()));
  const matchedGuides = guides
    .filter(
      (g) =>
        matchedCropCodes.has(g.cropCode.toLowerCase()) ||
        normalizedQuery.includes(g.issueNameEn.toLowerCase()) ||
        normalizedQuery.includes(g.cropNameEn.toLowerCase()),
    )
    .slice(0, 4);

  return { matchedCrops, matchedGuides };
}

function buildGroundingContextText(
  profile: FarmerContextProfile | null,
  matchedCrops: CropKnowledgeRecord[],
  matchedGuides: PlantProtectionGuideRecord[],
  recentHistory: AiChatMessageRecord[],
): string {
  const sections: string[] = [];

  if (profile) {
    const soilParts = profile.hasSoilReport && profile.soilReport
      ? [
          `N: ${profile.soilReport.nitrogenUnknown ? 'Unknown' : (profile.soilReport.nitrogenKgPerHa ?? 'Not provided')} kg/ha`,
          `P: ${profile.soilReport.phosphorusUnknown ? 'Unknown' : (profile.soilReport.phosphorusKgPerHa ?? 'Not provided')} kg/ha`,
          `K: ${profile.soilReport.potassiumUnknown ? 'Unknown' : (profile.soilReport.potassiumKgPerHa ?? 'Not provided')} kg/ha`,
          `pH: ${profile.soilReport.phUnknown ? 'Unknown' : (profile.soilReport.phLevel ?? 'Not provided')}`,
        ].join(', ')
      : `Soil report not entered; field soil type: ${profile.soilType || 'Not specified'}`;

    sections.push(
      [
        'SAVED FARMER PROFILE:',
        `- Farmer: ${profile.farmerName}`,
        `- Location: ${[profile.village, profile.district, profile.state].filter(Boolean).join(', ') || 'Not specified'}`,
        `- Land area: ${profile.landSize ?? 'Unknown'} ${profile.landUnit || ''}`,
        `- Irrigation source: ${profile.irrigationSource || 'Not specified'}`,
        `- Season: ${profile.growingSeason || 'Not specified'}`,
        `- Current/previous crop: ${profile.currentOrPreviousCrop || 'Not specified'}`,
        `- Soil details: ${soilParts}`,
      ].join('\n'),
    );
  }

  if (matchedCrops.length > 0) {
    sections.push(
      'KRISHISETU CROP KNOWLEDGE DATASET RECORDS:\n' +
        matchedCrops
          .map(
            (c) =>
              `• ${c.nameEn} (${c.nameKn}, code=${c.cropCode}): Soils=[${c.suitableSoils.join(', ')}], Seasons=[${c.seasons.join(', ')}], Water=${c.waterRequirement} (${c.waterNotesEn}), Duration=${c.durationMinDays}-${c.durationMaxDays} days, pH=${c.minPh}-${c.maxPh}, States=[${c.supportedStates.join(', ')}], Rotation=${c.rotationalBenefitsEn || 'N/A'}, Guidance=[Prep: ${c.growingGuidanceEn.landPreparation}; Sowing: ${c.growingGuidanceEn.sowingAndSpacing}; Irrigation: ${c.growingGuidanceEn.irrigationSchedule}; Nutrients: ${c.growingGuidanceEn.nutrientPractice}], Source=${c.sourceReference}`,
          )
          .join('\n'),
    );
  }

  if (matchedGuides.length > 0) {
    sections.push(
      'KRISHISETU PEST & DISEASE PREVENTION REFERENCES:\n' +
        matchedGuides
          .map(
            (g) =>
              `• ${g.cropNameEn} — ${g.issueNameEn} (${g.issueType}): Symptoms=${g.symptomsEn.join('; ')}; Prevention=${g.preventivePracticesEn.join('; ')}; Responsible Guidance=${g.responsibleManagementEn.join('; ')}; Source=${g.sourceReference}`,
          )
          .join('\n'),
    );
  }

  if (recentHistory.length > 0) {
    sections.push(
      'RECENT CONVERSATION CONTEXT:\n' +
        recentHistory
          .slice(-6)
          .map((m) => `${m.role}: ${m.content}`)
          .join('\n'),
    );
  }

  return sections.join('\n\n');
}

export async function generateGroundedAiReply(params: {
  userId: string;
  userMessage: string;
  language: AssistantLanguage;
  profile: FarmerContextProfile | null;
  crops: CropKnowledgeRecord[];
  guides: PlantProtectionGuideRecord[];
  recentHistory: AiChatMessageRecord[];
}): Promise<{ userEntry: AiChatMessageRecord; assistantEntry: AiChatMessageRecord }> {
  const cfg = resolveGeminiConfig();
  if (!cfg.apiKey) {
    throw new AiServiceError(
      503,
      'API_KEY_MISSING',
      'AI Farmer Assistant is unavailable because GEMINI_API_KEY is not configured on the backend server. Configure GEMINI_API_KEY in the server environment or Settings > Secrets.',
    );
  }

  const trimmedMsg = params.userMessage.trim();
  if (!trimmedMsg) {
    throw new AiServiceError(400, 'VALIDATION_ERROR', 'Please enter a farming question.');
  }

  const { matchedCrops, matchedGuides } = selectRelevantKnowledgeContext(
    trimmedMsg,
    params.profile,
    params.crops,
    params.guides,
  );
  const contextText = buildGroundingContextText(
    params.profile,
    matchedCrops,
    matchedGuides,
    params.recentHistory,
  );

  const langDirective =
    params.language === 'kn'
      ? 'Respond clearly in natural, respectful Kannada (ಕನ್ನಡ script). Include technical agricultural terms concisely when helpful.'
      : 'Respond clearly in plain, practical Indian English suitable for farmers and extension staff.';

  const systemInstruction = [
    'You are KrishiSetu AI Farmer Assistant, an evidence-grounded agricultural knowledge helper for Indian farmers.',
    langDirective,
    'Use the provided SAVED FARMER PROFILE and KRISHISETU CROP KNOWLEDGE DATASET RECORDS whenever relevant, and cite KrishiSetu references or ICAR/SAU/KVK practices faithfully.',
    'STRICT HONESTY GUARDRAILS:',
    '1. NEVER invent or guess live mandi market prices, future prices, profit guarantees, or yields.',
    '2. NEVER invent live weather forecasts or rainfall numbers — tell the farmer to check the Weather Forecast section in KrishiSetu for real-time Open-Meteo data.',
    '3. NEVER invent phone numbers, email addresses, or unverified private service providers.',
    '4. NEVER claim a confirmed plant disease diagnosis from text alone or prescribe specific pesticide/chemical dosages (g/L or ml/acre); advise verifying leaf symptoms via KrishiSetu Disease Scanner or local KVK/RSK agricultural officers.',
    '5. When data is missing from the farmer profile (such as missing NPK or pH), mention that explicitly and encourage soil testing.',
    'Keep responses concise (around 150–260 words unless detailed steps are requested), structured cleanly with readable bullet points, and directly actionable.',
  ].join('\n');

  const promptContent = `${contextText}\n\nFARMER QUESTION (${params.language.toUpperCase()}):\n${trimmedMsg}`;

  const ai = new GoogleGenAI({
    apiKey: cfg.apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  try {
    let response;
    try {
      response = await ai.models.generateContent({
        model: cfg.model,
        contents: promptContent,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });
    } catch (firstErr) {
      const msg = (firstErr instanceof Error ? firstErr.message : String(firstErr)).toLowerCase();
      if (msg.includes('503') || msg.includes('high demand') || msg.includes('unavailable')) {
        await new Promise((r) => setTimeout(r, 900));
        response = await ai.models.generateContent({
          model: cfg.model,
          contents: promptContent,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        });
      } else {
        throw firstErr;
      }
    }

    const answerText = (response.text || '').trim();
    if (!answerText) {
      throw new AiServiceError(
        502,
        'UPSTREAM_ERROR',
        'Gemini returned an empty response. Please retry your question.',
      );
    }

    const now = new Date().toISOString();
    const groundedCrops = matchedCrops.map((c) => ({
      cropCode: c.cropCode,
      nameEn: c.nameEn,
      nameKn: c.nameKn,
      sourceReference: c.sourceReference || 'KrishiSetu Curated Dataset',
    }));

    const userEntry: AiChatMessageRecord = {
      id: crypto.randomUUID(),
      userId: params.userId,
      role: 'USER',
      language: params.language,
      content: trimmedMsg,
      model: null,
      groundedCrops: [],
      createdAt: now,
    };

    const assistantEntry: AiChatMessageRecord = {
      id: crypto.randomUUID(),
      userId: params.userId,
      role: 'ASSISTANT',
      language: params.language,
      content: answerText,
      model: cfg.model,
      groundedCrops,
      createdAt: new Date(Date.now() + 1).toISOString(),
    };

    return { userEntry, assistantEntry };
  } catch (err) {
    if (err instanceof AiServiceError) throw err;
    const rawMsg = err instanceof Error ? err.message : String(err);
    const lower = rawMsg.toLowerCase();

    if (lower.includes('429') || lower.includes('resource_exhausted') || lower.includes('quota')) {
      throw new AiServiceError(
        429,
        'QUOTA_EXHAUSTED',
        'Gemini API free-tier or rate quota has been reached. Wait a moment before retrying, or verify your Gemini quota in Google AI Studio.',
      );
    }
    if (
      lower.includes('api_key_invalid') ||
      lower.includes('permission_denied') ||
      lower.includes('401') ||
      lower.includes('403')
    ) {
      throw new AiServiceError(
        502,
        'API_KEY_INVALID',
        'Configured GEMINI_API_KEY was rejected by the Gemini API. Verify the backend key in Settings > Secrets.',
      );
    }
    if (lower.includes('503') || lower.includes('high demand') || lower.includes('unavailable')) {
      throw new AiServiceError(
        503,
        'UPSTREAM_UNAVAILABLE',
        'Gemini service is temporarily busy due to high demand. No synthetic reply was generated—please click Retry in a moment.',
      );
    }
    if (lower.includes('timeout') || lower.includes('aborted')) {
      throw new AiServiceError(
        504,
        'UPSTREAM_TIMEOUT',
        'Gemini service timed out while preparing a response. Please retry.',
      );
    }
    throw new AiServiceError(
      502,
      'UPSTREAM_ERROR',
      'Unable to reach Gemini service right now. No synthetic reply was generated.',
    );
  }
}
