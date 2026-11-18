export type AssistantLanguage = 'en' | 'kn';

export interface GroundedCropRef {
  cropCode: string;
  nameEn: string;
  nameKn: string;
  sourceReference: string;
}

export interface AiChatMessage {
  id: string;
  userId: string;
  role: 'USER' | 'ASSISTANT';
  language: AssistantLanguage;
  content: string;
  model: string | null;
  groundedCrops: GroundedCropRef[];
  createdAt: string;
}

export interface AiAssistantStatus {
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

export interface AiChatExchangeResponse {
  userMessage: AiChatMessage;
  assistantMessage: AiChatMessage;
}
