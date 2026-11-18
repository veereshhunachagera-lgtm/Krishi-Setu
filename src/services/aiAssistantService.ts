import type {
  AiAssistantStatus,
  AiChatExchangeResponse,
  AiChatMessage,
  AssistantLanguage,
} from '../types/aiAssistant';
import { apiRequest } from './apiClient';

export const aiAssistantService = {
  getStatus() {
    return apiRequest<AiAssistantStatus>('/api/v1/ai-assistant/status');
  },

  getHistory() {
    return apiRequest<AiChatMessage[]>('/api/v1/ai-assistant/messages');
  },

  sendMessage(message: string, language: AssistantLanguage) {
    return apiRequest<AiChatExchangeResponse>('/api/v1/ai-assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message, language }),
    });
  },

  clearHistory() {
    return apiRequest<void>('/api/v1/ai-assistant/messages', {
      method: 'DELETE',
    });
  },
};
