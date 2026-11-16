import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  FileWarning,
  RefreshCw,
  ShieldAlert,
  Upload,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { inputBaseClass } from '../../components/FormField';
import { ErrorBanner, LoadingSkeleton } from '../../components/StatePanels';
import { plantHealthService } from '../../services/plantHealthService';
import type { FarmerProfile } from '../../types/farmer';
import type { PlantDiseaseScanItem, ScannerStatusInfo } from '../../types/plantHealth';

interface DiseaseScannerPanelProps {
  profile: FarmerProfile | null;
  onOpenGuidance: (cropCode?: string) => void;
}

const CROP_OPTIONS = [
  { code: 'tomato', labelKey: 'plantHealth.crops.tomato' },
  { code: 'potato', labelKey: 'plantHealth.crops.potato' },
  { code: 'maize', labelKey: 'plantHealth.crops.maize' },
  { code: 'soybean', labelKey: 'plantHealth.crops.soybean' },
  { code: 'grape', labelKey: 'plantHealth.crops.grape' },
  { code: 'bell-pepper', labelKey: 'plantHealth.crops.bellPepper' },
  { code: 'ragi', labelKey: 'plantHealth.crops.ragi' },
  { code: 'paddy', labelKey: 'plantHealth.crops.paddy' },
  { code: 'tur-dal', labelKey: 'plantHealth.crops.turDal' },
  { code: 'groundnut', labelKey: 'plantHealth.crops.groundnut' },
  { code: 'onion', labelKey: 'plantHealth.crops.onion' },
  { code: 'cotton', labelKey: 'plantHealth.crops.cotton' },
  { code: 'other', labelKey: 'plantHealth.crops.other' },
];

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

function inferCropCodeFromProfile(profile: FarmerProfile | null): string {
  const raw = (profile?.currentOrPreviousCrop || '').toLowerCase();
  if (!raw) return 'tomato';
  if (raw.includes('ragi')) return 'ragi';
  if (raw.includes('paddy') || raw.includes('rice')) return 'paddy';
  if (raw.includes('maize') || raw.includes('corn')) return 'maize';
  if (raw.includes('tur') || raw.includes('pigeon')) return 'tur-dal';
  if (raw.includes('groundnut') || raw.includes('peanut')) return 'groundnut';
  if (raw.includes('tomato')) return 'tomato';
  if (raw.includes('potato')) return 'potato';
  if (raw.includes('soybean')) return 'soybean';
  if (raw.includes('onion')) return 'onion';
  if (raw.includes('cotton')) return 'cotton';
  return 'tomato';
}

export function DiseaseScannerPanel({ profile, onOpenGuidance }: DiseaseScannerPanelProps) {
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const [status, setStatus] = useState<ScannerStatusInfo | null>(null);
  const [history, setHistory] = useState<PlantDiseaseScanItem[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cropCode, setCropCode] = useState<string>(() => inferCropCodeFromProfile(profile));
  const [farmerNotes, setFarmerNotes] = useState('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(
    null,
  );
  const [clientFileError, setClientFileError] = useState<string | null>(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [latestResult, setLatestResult] = useState<PlantDiseaseScanItem | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    setCameraOpen(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl, stopCamera]);

  const loadInitial = useCallback(async () => {
    setLoadingInit(true);
    setError(null);
    try {
      const [statusRes, historyRes] = await Promise.all([
        plantHealthService.getScannerStatus(),
        plantHealthService.getScanHistory(),
      ]);
      setStatus(statusRes);
      setHistory(historyRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setLoadingInit(false);
    }
  }, [t]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const acceptImageFile = (file: File) => {
    setClientFileError(null);
    setLatestResult(null);

    if (!ALLOWED_TYPES.has(file.type.toLowerCase())) {
      setClientFileError(t('plantHealth.scanner.invalidFileType'));
      return;
    }
    if (file.size > MAX_BYTES) {
      setClientFileError(t('plantHealth.scanner.fileTooLarge'));
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const nextUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(nextUrl);

    const probe = new Image();
    probe.onload = () => {
      setImageDimensions({ width: probe.naturalWidth, height: probe.naturalHeight });
    };
    probe.src = nextUrl;
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      acceptImageFile(file);
    }
    e.target.value = '';
  };

  const handleOpenLiveCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(t('plantHealth.scanner.cameraUnsupported'));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 50);
    } catch {
      setCameraError(t('plantHealth.scanner.cameraPermissionDenied'));
    }
  };

  const handleCaptureFrame = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const captured = new File([blob], `leaf-capture-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });
        acceptImageFile(captured);
        stopCamera();
      },
      'image/jpeg',
      0.92,
    );
  };

  const clearSelectedImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    setImageDimensions(null);
    setClientFileError(null);
    setLatestResult(null);
  };

  const handleSubmitScan = async () => {
    if (!selectedFile) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await plantHealthService.analyzeLeafImage({
        file: selectedFile,
        cropCode: cropCode === 'other' ? undefined : cropCode,
        farmerNotes,
      });
      setLatestResult(res);
      setHistory((prev) => [res, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  const cropSupportedByModel =
    cropCode !== 'other' && (status?.supportedCrops || []).includes(cropCode.toLowerCase());

  if (loadingInit && !status) {
    return <LoadingSkeleton rows={5} />;
  }

  return (
    <div className="space-y-6">
      {error && <ErrorBanner message={error} onRetry={loadInitial} retryLabel={t('common.retry')} />}

      {/* Honest Model Connectivity Status */}
      {status && (
        <section
          className={`rounded-xl border p-5 space-y-2.5 ${
            status.modelConnected
              ? 'border-[#B8D4C5] bg-[#E7F1EC]'
              : 'border-[#E5D5B8] bg-[#FBF6EC]'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[#17221B]">
              {status.modelConnected ? (
                <CheckCircle2 className="h-4 w-4 text-[#1B4332] shrink-0" aria-hidden="true" />
              ) : (
                <ShieldAlert className="h-4 w-4 text-[#8C5A2B] shrink-0" aria-hidden="true" />
              )}
              <h2 className="font-display text-sm font-semibold">
                {status.modelConnected
                  ? t('plantHealth.scanner.modelConnectedHeading')
                  : t('plantHealth.scanner.modelUnavailableHeading')}
              </h2>
            </div>
            <button
              type="button"
              onClick={loadInitial}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B4332] hover:underline self-start sm:self-auto cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              {t('plantHealth.scanner.recheckModel')}
            </button>
          </div>
          <p className="text-xs text-[#4A5A50] leading-relaxed">
            {isKn ? status.statusMessageKn : status.statusMessageEn}
          </p>
          <p className="font-mono text-[11px] text-[#748379]">
            {t('plantHealth.scanner.configuredModelLabel')}: {status.configuredModelId} ·{' '}
            {t('plantHealth.scanner.minThresholdLabel')}:{' '}
            {Math.round(status.confidenceThreshold * 100)}%
          </p>
        </section>
      )}

      {/* Upload & Camera Workspace */}
      <section className="rounded-xl border border-[#E5E1D8] bg-white p-5 space-y-5">
        <div className="space-y-1">
          <h2 className="font-display text-base font-semibold text-[#17221B]">
            {t('plantHealth.scanner.uploadHeading')}
          </h2>
          <p className="text-xs text-[#4A5A50]">{t('plantHealth.scanner.uploadSubtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-1.5 block">
            <span className="text-xs font-medium text-[#4A5A50]">
              {t('plantHealth.scanner.selectCropLabel')}
            </span>
            <select
              value={cropCode}
              onChange={(e) => setCropCode(e.target.value)}
              className={inputBaseClass}
            >
              {CROP_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </select>
            {!cropSupportedByModel && (
              <p className="text-xs text-[#8C5A2B]">
                {t('plantHealth.scanner.cropOutsideDomainHint')}
              </p>
            )}
          </label>

          <label className="space-y-1.5 block">
            <span className="text-xs font-medium text-[#4A5A50]">
              {t('plantHealth.scanner.notesLabel')}
            </span>
            <input
              type="text"
              value={farmerNotes}
              onChange={(e) => setFarmerNotes(e.target.value)}
              maxLength={400}
              placeholder={t('plantHealth.scanner.notesPlaceholder')}
              className={inputBaseClass}
            />
          </label>
        </div>

        {/* Hidden file inputs for standard upload and mobile rear-camera capture */}
        <input
          ref={uploadInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileInputChange}
          className="hidden"
          aria-label={t('plantHealth.scanner.chooseImageBtn')}
        />
        <input
          ref={nativeCameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileInputChange}
          className="hidden"
          aria-label={t('plantHealth.scanner.deviceCameraBtn')}
        />

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => uploadInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            {t('plantHealth.scanner.chooseImageBtn')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => nativeCameraInputRef.current?.click()}
          >
            <Camera className="h-4 w-4" aria-hidden="true" />
            {t('plantHealth.scanner.deviceCameraBtn')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={cameraOpen ? stopCamera : handleOpenLiveCamera}
          >
            <Camera className="h-4 w-4" aria-hidden="true" />
            {cameraOpen
              ? t('plantHealth.scanner.closeLiveCameraBtn')
              : t('plantHealth.scanner.openLiveCameraBtn')}
          </Button>
        </div>

        {cameraError && (
          <p className="text-xs text-[#8C5A2B]">{cameraError}</p>
        )}
        {clientFileError && (
          <p className="text-xs font-medium text-[#B42318]">{clientFileError}</p>
        )}

        {/* Live Camera Viewfinder */}
        {cameraOpen && (
          <div className="rounded-xl border border-[#E5E1D8] bg-[#17221B] p-4 space-y-3">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full max-h-72 rounded-lg object-contain bg-black"
            />
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={stopCamera}>
                {t('common.cancel')}
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={handleCaptureFrame}>
                {t('plantHealth.scanner.captureFrameBtn')}
              </Button>
            </div>
          </div>
        )}

        {/* Mandatory Pre-Submission Preview */}
        {previewUrl && selectedFile && (
          <div className="rounded-xl border border-[#E5E1D8] bg-[#FAF8F4] p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-[#4A5A50]">
                <span className="font-semibold text-[#17221B]">{selectedFile.name}</span>
                <span aria-hidden="true"> · </span>
                <span className="font-mono tabular-nums">
                  {Math.round(selectedFile.size / 1024)} KB
                </span>
                {imageDimensions && (
                  <>
                    <span aria-hidden="true"> · </span>
                    <span className="font-mono tabular-nums">
                      {imageDimensions.width} × {imageDimensions.height} px
                    </span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={clearSelectedImage}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#4A5A50] hover:text-[#B42318] cursor-pointer"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                {t('plantHealth.scanner.clearImageBtn')}
              </button>
            </div>

            <div className="flex justify-center rounded-lg border border-[#E5E1D8] bg-white p-2">
              <img
                src={previewUrl}
                alt={t('plantHealth.scanner.previewAlt')}
                className="max-h-72 w-auto rounded object-contain"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-[#4A5A50]">{t('plantHealth.scanner.previewNote')}</p>
              <Button
                type="button"
                variant="primary"
                size="md"
                loading={submitting}
                onClick={handleSubmitScan}
              >
                {submitting
                  ? t('plantHealth.scanner.analyzingBtn')
                  : t('plantHealth.scanner.submitScanBtn')}
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Latest Scan Output (Zero Fabricated Diagnosis) */}
      {latestResult && (
        <section className="rounded-xl border border-[#E5E1D8] bg-white p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-[#748379]">
                {t(`plantHealth.scanner.statuses.${latestResult.scanStatus}`)}
                {latestResult.modelId ? ` · ${latestResult.modelId}` : ''}
              </p>
              <h3 className="font-display text-lg font-semibold text-[#17221B]">
                {latestResult.scanStatus === 'PREDICTION_READY' && latestResult.predictedLabel
                  ? latestResult.predictedLabel.replace(/___/g, ' — ').replace(/_/g, ' ')
                  : t(`plantHealth.scanner.statusHeadings.${latestResult.scanStatus}`)}
              </h3>
            </div>
            {latestResult.scanStatus === 'PREDICTION_READY' &&
              latestResult.confidence !== null && (
                <p className="font-mono text-lg font-bold text-[#1B4332] tabular-nums">
                  {Math.round(latestResult.confidence * 100)}%
                </p>
              )}
          </div>

          {latestResult.scanStatus !== 'PREDICTION_READY' && (
            <div className="rounded-lg border border-[#E5D5B8] bg-[#FBF6EC] p-4 space-y-2 text-xs text-[#4A5A50]">
              <div className="flex items-center gap-2 font-semibold text-[#17221B]">
                {latestResult.scanStatus === 'UNCERTAIN_POOR_QUALITY' ? (
                  <FileWarning className="h-4 w-4 text-[#8C5A2B]" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-[#8C5A2B]" aria-hidden="true" />
                )}
                <span>{t('plantHealth.scanner.uncertainNoticeTitle')}</span>
              </div>
              <p>{isKn ? latestResult.reasonKn || latestResult.reasonEn : latestResult.reasonEn}</p>
              <button
                type="button"
                onClick={() => onOpenGuidance(cropCode !== 'other' ? cropCode : undefined)}
                className="font-semibold text-[#1B4332] hover:underline cursor-pointer"
              >
                {t('plantHealth.scanner.openPreventionInstead')}
              </button>
            </div>
          )}

          {latestResult.topCandidates.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[#17221B]">
                {t('plantHealth.scanner.candidatesTitle')}
              </h4>
              <ul className="divide-y divide-[#E5E1D8] text-xs">
                {latestResult.topCandidates.map((cand) => (
                  <li key={cand.label} className="py-2 flex items-center justify-between gap-3">
                    <span className="text-[#4A5A50]">
                      {cand.label.replace(/___/g, ' — ').replace(/_/g, ' ')}
                    </span>
                    <span className="font-mono tabular-nums font-medium text-[#17221B]">
                      {(cand.confidence * 100).toFixed(1)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {latestResult.scanStatus === 'PREDICTION_READY' &&
            (isKn ? latestResult.preventiveGuidanceKn : latestResult.preventiveGuidanceEn)?.length ? (
            <div className="space-y-1.5 border-t border-[#E5E1D8] pt-3">
              <h4 className="text-xs font-semibold text-[#1B4332]">
                {t('plantHealth.scanner.matchedGuidanceTitle')}
              </h4>
              <ul className="list-disc pl-4 space-y-1 text-xs text-[#4A5A50]">
                {(isKn
                  ? latestResult.preventiveGuidanceKn || []
                  : latestResult.preventiveGuidanceEn || []
                ).map((g, idx) => (
                  <li key={idx}>{g}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="border-t border-[#E5E1D8] pt-3 text-xs text-[#748379]">
            {isKn ? latestResult.safetyReminderKn : latestResult.safetyReminderEn}
          </p>
        </section>
      )}

      {/* Recent Scan Log */}
      <section className="rounded-xl border border-[#E5E1D8] bg-white p-5 space-y-3">
        <h3 className="font-display text-sm font-semibold text-[#17221B]">
          {t('plantHealth.scanner.historyTitle')} ({history.length})
        </h3>
        {history.length === 0 ? (
          <p className="text-xs text-[#4A5A50]">{t('plantHealth.scanner.historyEmpty')}</p>
        ) : (
          <div className="divide-y divide-[#E5E1D8] text-xs">
            {history.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <p className="font-medium text-[#17221B]">
                    {item.originalFileName}
                    {item.cropCode ? ` · ${item.cropCode}` : ''}
                  </p>
                  <p className="text-[#4A5A50]">
                    {t(`plantHealth.scanner.statuses.${item.scanStatus}`)}
                    {item.predictedLabel
                      ? ` · ${item.predictedLabel.replace(/___/g, ' — ').replace(/_/g, ' ')}`
                      : ''}
                  </p>
                </div>
                <span className="font-mono text-[#748379] tabular-nums">
                  {new Date(item.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
