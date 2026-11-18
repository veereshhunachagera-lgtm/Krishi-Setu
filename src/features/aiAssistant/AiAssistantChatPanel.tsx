import { Bot, Loader2, RefreshCw, Send, ShieldCheck, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { ErrorBanner, LoadingSkeleton } from '../../components/StatePanels';
import { aiAssistantService } from '../../services/aiAssistantService';
import { ApiClientError } from '../../services/apiClient';
import type {
  AiAssistantStatus,
  AiChatMessage,
  AssistantLanguage,
} from '../../types/aiAssistant';
import type { FarmerProfile } from '../../types/farmer';

interface AiAssistantChatPanelProps {
  profile: FarmerProfile | null;
  initialTopic?: 'general' | 'soil-report';
}

const SUGGESTED_QUESTIONS: Record<
  'general' | 'soil-report',
  Record<AssistantLanguage, string[]>
> = {
  general: {
    en: [
      'Which Kharif and Rabi crops fit my district, soil type, and irrigation source?',
      'What low-water alternative crops should I consider if monsoon rains are delayed?',
      'What crop rotation schedule with pulses helps restore soil fertility after cereals?',
      'What preventive farm hygiene steps reduce fungal leaf blight without chemical overuse?',
    ],
    kn: [
      'ನನ್ನ ಜಿಲ್ಲೆ, ಮಣ್ಣಿನ ವಿಧ ಮತ್ತು ನೀರಾವರಿಗೆ ಯಾವ ಮುಂಗಾರು ಮತ್ತು ಹಿಂಗಾರು ಬೆಳೆಗಳು ಸೂಕ್ತ?',
      'ಮಳೆ ತಡವಾದರೆ ಕಡಿಮೆ ನೀರಿನ ಯಾವ ಪರ್ಯಾಯ ಬೆಳೆಗಳನ್ನು ಬೆಳೆಯಬಹುದು?',
      'ಧಾನ್ಯ ಬೆಳೆಗಳ ನಂತರ ಮಣ್ಣಿನ ಫಲವತ್ತತೆ ಉಳಿಸಲು ಯಾವ ದ್ವಿದಳ ಧಾನ್ಯ ಬೆಳೆ ಪರಿವರ್ತನೆ ಸೂಕ್ತ?',
      'ರಾಸಾಯನಿಕಗಳ ಅತಿಯಾದ ಬಳಕೆಯಿಲ್ಲದೆ ಎಲೆ ರೋಗ ತಡೆಗಟ್ಟುವ ಸುರಕ್ಷಿತ ಕ್ರಮಗಳು ಯಾವುವು?',
    ],
  },
  'soil-report': {
    en: [
      'Explain what my saved Nitrogen, Phosphorus, Potassium, and pH levels mean for sowing.',
      'My soil test values are partly missing or unknown — what field steps should I take first?',
      'How should I collect and submit a composite soil sample to my nearest KVK soil lab?',
      'Which organic compost and green manure practices improve red and black soil structure?',
    ],
    kn: [
      'ನನ್ನ ಪ್ರೊಫೈಲ್‌ನಲ್ಲಿರುವ ಸಾರಜನಕ, ರಂಜಕ, ಪೊಟ್ಯಾಸಿಯಮ್ ಮತ್ತು pH ಮೌಲ್ಯಗಳ ಅರ್ಥವನ್ನು ವಿವರಿಸಿ.',
      'ನನ್ನ ಮಣ್ಣು ಪರೀಕ್ಷಾ ಮೌಲ್ಯಗಳು ಇಲ್ಲದಿದ್ದರೆ ಮೊದಲು ಯಾವ ಜಮೀನು ಕ್ರಮಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳಬೇಕು?',
      'ಸಮೀಪದ ಕೆವಿಕೆ ಮಣ್ಣು ಪ್ರಯೋಗಾಲಯಕ್ಕೆ ಮಣ್ಣಿನ ಮಾದರಿಯನ್ನು ಹೇಗೆ ಸಂಗ್ರಹಿಸಿ ನೀಡಬೇಕು?',
      'ಕೆಂಪು ಮತ್ತು ಕಪ್ಪು ಮಣ್ಣಿನ ಫಲವತ್ತತೆ ಸುಧಾರಿಸಲು ಯಾವ ಸಾವಯವ ಗೊಬ್ಬರ ಕ್ರಮಗಳು ಉತ್ತಮ?',
    ],
  },
};

export function AiAssistantChatPanel({
  profile,
  initialTopic = 'general',
}: AiAssistantChatPanelProps) {
  const { t, i18n } = useTranslation();
  const isUiKn = i18n.language === 'kn';

  const [chatLanguage, setChatLanguage] = useState<AssistantLanguage>(
    i18n.language === 'kn' ? 'kn' : 'en',
  );
  const [status, setStatus] = useState<AiAssistantStatus | null>(null);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [promptInput, setPromptInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  const threadEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setChatLanguage(i18n.language === 'kn' ? 'kn' : 'en');
  }, [i18n.language]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [statusRes, historyRes] = await Promise.all([
        aiAssistantService.getStatus(),
        aiAssistantService.getHistory(),
      ]);
      setStatus(statusRes);
      setMessages(historyRes);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (messages.length > 0 || sending) {
      threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages.length, sending]);

  const submitPrompt = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setSendError(null);
    setLastFailedPrompt(null);

    try {
      const res = await aiAssistantService.sendMessage(trimmed, chatLanguage);
      setMessages((prev) => [...prev, res.userMessage, res.assistantMessage]);
      setPromptInput('');
    } catch (err) {
      const msg =
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : t('errors.generic');
      setSendError(msg);
      setLastFailedPrompt(trimmed);
    } finally {
      setSending(false);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitPrompt(promptInput);
  };

  const handleRetryFailed = async () => {
    if (!lastFailedPrompt) return;
    await submitPrompt(lastFailedPrompt);
  };

  const handleClearHistory = async () => {
    if (clearing || messages.length === 0) return;
    setClearing(true);
    setSendError(null);
    try {
      await aiAssistantService.clearHistory();
      setMessages([]);
      setLastFailedPrompt(null);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setClearing(false);
    }
  };

  const suggestedList = SUGGESTED_QUESTIONS[initialTopic][chatLanguage];
  const canSend = Boolean(status?.configured) && !sending;

  return (
    <div className="space-y-5">
      {/* Grounded Scope & Language Controls */}
      <section className="rounded-xl border border-[#E5E1D8] bg-white p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E1D8] pb-4">
          <div className="flex items-start gap-2.5">
            <Bot className="h-5 w-5 text-[#1B4332] mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="font-display text-lg font-semibold text-[#17221B]">
                {initialTopic === 'soil-report'
                  ? t('aiAssistant.soilModeTitle')
                  : t('aiAssistant.title')}
              </h2>
              <p className="text-xs text-[#4A5A50] mt-0.5">
                {status
                  ? `${status.provider} · ${status.model}`
                  : t('aiAssistant.loadingStatus')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start">
            <span className="text-xs text-[#748379]">{t('aiAssistant.replyLanguageLabel')}:</span>
            <div className="flex items-center gap-1 rounded-lg bg-[#EDEAE2] p-1">
              <button
                type="button"
                onClick={() => setChatLanguage('en')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  chatLanguage === 'en'
                    ? 'bg-white text-[#17221B] shadow-xs'
                    : 'text-[#4A5A50] hover:text-[#17221B]'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setChatLanguage('kn')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  chatLanguage === 'kn'
                    ? 'bg-white text-[#17221B] shadow-xs'
                    : 'text-[#4A5A50] hover:text-[#17221B]'
                }`}
              >
                ಕನ್ನಡ
              </button>
            </div>
          </div>
        </div>

        {/* Profile Context Line */}
        {profile && (
          <p className="text-xs text-[#4A5A50] leading-relaxed">
            <span className="font-semibold text-[#17221B]">
              {t('aiAssistant.groundedContextLabel')}:{' '}
            </span>
            {[profile.village, profile.district, profile.state].filter(Boolean).join(', ') ||
              t('common.notProvided')}
            {profile.currentOrPreviousCrop ? ` · ${profile.currentOrPreviousCrop}` : ''}
            {' · '}
            {profile.hasSoilReport
              ? t('aiAssistant.soilReportAttached')
              : t('aiAssistant.soilReportMissing')}
          </p>
        )}

        <div className="flex items-start gap-2 rounded-lg bg-[#FAF8F4] border border-[#E5E1D8] px-3.5 py-2.5 text-xs text-[#4A5A50]">
          <ShieldCheck className="h-4 w-4 text-[#1B4332] shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <p>{status ? (isUiKn ? status.safetyScopeKn : status.safetyScopeEn) : t('aiAssistant.safetyFallback')}</p>
            {status && (
              <p className="text-[#748379]">
                {isUiKn ? status.freeTierTermsKn : status.freeTierTermsEn}
              </p>
            )}
          </div>
        </div>
      </section>

      {loadError && (
        <ErrorBanner message={loadError} onRetry={loadAll} retryLabel={t('common.retry')} />
      )}

      {/* Honest Unavailable + Setup Instructions Notice when GEMINI_API_KEY is not configured */}
      {!loading && status && !status.configured && (
        <section
          role="status"
          className="rounded-xl border border-[#E5D5C3] bg-[#FBF6F0] p-5 space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="font-display text-base font-semibold text-[#8C5A2B]">
              {t('aiAssistant.unavailableTitle')}
            </h3>
            <Button variant="secondary" size="sm" onClick={loadAll}>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              {t('aiAssistant.recheckBtn')}
            </Button>
          </div>
          <p className="text-sm text-[#4A5A50] leading-relaxed">
            {t('aiAssistant.unavailableDescription')}
          </p>
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-[#17221B]">
              {t('aiAssistant.setupStepsTitle')}
            </p>
            <ol className="list-decimal list-inside space-y-1 text-xs text-[#4A5A50]">
              {(isUiKn ? status.setupInstructionsKn : status.setupInstructionsEn).map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* Suggested Starter Questions */}
      <section className="rounded-xl border border-[#E5E1D8] bg-white p-5 space-y-3">
        <h3 className="font-display text-sm font-semibold text-[#17221B]">
          {t('aiAssistant.suggestedTitle')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {suggestedList.map((q) => (
            <button
              key={q}
              type="button"
              disabled={sending}
              onClick={() => {
                if (canSend) {
                  submitPrompt(q);
                } else {
                  setPromptInput(q);
                }
              }}
              className="rounded-lg border border-[#E5E1D8] bg-[#FAF8F4] px-3.5 py-2.5 text-left text-xs text-[#17221B] hover:border-[#1B4332] hover:bg-white transition-colors cursor-pointer disabled:opacity-60"
            >
              {q}
            </button>
          ))}
        </div>
      </section>

      {/* Conversation History Thread + Input Box */}
      <section className="rounded-xl border border-[#E5E1D8] bg-white overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-[#E5E1D8] px-5 py-3.5 bg-[#FAF8F4]">
          <span className="text-xs font-semibold text-[#17221B]">
            {t('aiAssistant.conversationTitle')} ({messages.length})
          </span>
          {messages.length > 0 && (
            <button
              type="button"
              disabled={clearing}
              onClick={handleClearHistory}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#748379] hover:text-[#991B1B] cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              {t('aiAssistant.clearHistoryBtn')}
            </button>
          )}
        </div>

        <div className="p-5 space-y-4 max-h-[520px] overflow-y-auto">
          {loading ? (
            <LoadingSkeleton rows={3} />
          ) : messages.length === 0 && !sending ? (
            <div className="py-8 text-center space-y-1.5">
              <p className="text-sm font-medium text-[#17221B]">
                {t('aiAssistant.emptyHistoryTitle')}
              </p>
              <p className="text-xs text-[#748379] max-w-md mx-auto">
                {t('aiAssistant.emptyHistoryDesc')}
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === 'USER';
              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[88%] sm:max-w-[78%] rounded-xl px-4 py-3 text-sm leading-relaxed space-y-2 ${
                      isUser
                        ? 'bg-[#1B4332] text-white'
                        : 'border border-[#E5E1D8] bg-[#FAF8F4] text-[#17221B]'
                    }`}
                  >
                    <div
                      className={`text-[11px] font-medium flex items-center justify-between gap-3 ${
                        isUser ? 'text-[#CBE4D5]' : 'text-[#748379]'
                      }`}
                    >
                      <span>
                        {isUser ? t('aiAssistant.youLabel') : t('aiAssistant.assistantLabel')}
                        {' · '}
                        {msg.language === 'kn' ? 'ಕನ್ನಡ' : 'English'}
                        {!isUser && msg.model ? ` · ${msg.model}` : ''}
                      </span>
                      <span className="font-mono tabular-nums">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {!isUser && msg.groundedCrops && msg.groundedCrops.length > 0 && (
                      <div className="border-t border-[#E5E1D8] pt-2 text-[11px] text-[#4A5A50] space-y-1">
                        <p className="font-semibold text-[#1B4332]">
                          {t('aiAssistant.sourcesUsedLabel')}:
                        </p>
                        <ul className="space-y-0.5">
                          {msg.groundedCrops.map((ref) => (
                            <li key={ref.cropCode}>
                              {isUiKn ? ref.nameKn : ref.nameEn} — {ref.sourceReference}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {sending && (
            <div className="flex justify-start" aria-live="polite">
              <div className="inline-flex items-center gap-2 rounded-xl border border-[#E5E1D8] bg-[#FAF8F4] px-4 py-3 text-xs text-[#4A5A50]">
                <Loader2 className="h-4 w-4 animate-spin text-[#1B4332]" aria-hidden="true" />
                <span>{t('aiAssistant.thinkingStatus')}</span>
              </div>
            </div>
          )}

          <div ref={threadEndRef} />
        </div>

        {sendError && (
          <div className="px-5 pb-4">
            <ErrorBanner
              message={sendError}
              onRetry={lastFailedPrompt && status?.configured ? handleRetryFailed : undefined}
              retryLabel={t('common.retry')}
            />
          </div>
        )}

        <form
          onSubmit={handleSubmitForm}
          className="border-t border-[#E5E1D8] p-4 bg-[#FAF8F4]/60 space-y-3"
        >
          <label htmlFor="ai-chat-input" className="sr-only">
            {t('aiAssistant.inputPlaceholder')}
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <textarea
              id="ai-chat-input"
              rows={2}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (canSend && promptInput.trim()) {
                    submitPrompt(promptInput);
                  }
                }
              }}
              placeholder={t('aiAssistant.inputPlaceholder')}
              disabled={sending}
              className="flex-1 rounded-lg border border-[#E5E1D8] bg-white px-3.5 py-2.5 text-sm text-[#17221B] placeholder:text-[#748379] focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/15 resize-none"
            />
            <Button
              type="submit"
              disabled={!promptInput.trim() || !canSend}
              loading={sending}
              className="sm:self-end"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              {t('aiAssistant.sendBtn')}
            </Button>
          </div>
          {!loading && status && !status.configured && (
            <p className="text-xs text-[#8C5A2B]">
              {t('aiAssistant.sendDisabledHint')}
            </p>
          )}
        </form>
      </section>
    </div>
  );
}
