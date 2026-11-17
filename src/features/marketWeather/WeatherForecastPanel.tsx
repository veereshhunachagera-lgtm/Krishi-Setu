import {
  CloudRain,
  Compass,
  Droplets,
  ExternalLink,
  MapPin,
  Search,
  Thermometer,
  Wind,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '../../components/Button';
import { FormField, inputBaseClass } from '../../components/FormField';
import { ErrorBanner, LoadingSkeleton } from '../../components/StatePanels';
import { marketWeatherService } from '../../services/marketWeatherService';
import type { FarmerProfile } from '../../types/farmer';
import type { GeoLocationResult, WeatherForecastResponse } from '../../types/marketWeather';
import { cn } from '../../utils/cn';

interface WeatherForecastPanelProps {
  profile: FarmerProfile | null;
}

export function WeatherForecastPanel({ profile }: WeatherForecastPanelProps) {
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const [mode, setMode] = useState<'search' | 'coordinates'>('search');
  const [searchQuery, setSearchQuery] = useState(profile?.district || 'Mandya');
  const [suggestions, setSuggestions] = useState<GeoLocationResult[]>([]);
  const [searchingLocations, setSearchingLocations] = useState(false);

  const [latInput, setLatInput] = useState('');
  const [lonInput, setLonInput] = useState('');
  const [coordError, setCoordError] = useState<string | null>(null);

  const [forecast, setForecast] = useState<WeatherForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchByParams = useCallback(
    async (params: { lat?: number; lon?: number; locationName?: string; q?: string }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await marketWeatherService.getWeatherForecast(params);
        setForecast(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('errors.generic'));
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    const initialQ = profile?.district || profile?.state || 'Mandya';
    fetchByParams({ q: initialQ });
  }, [fetchByParams, profile?.district, profile?.state]);

  const handleLocationSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setError(t('marketWeather.weather.searchMinLength'));
      return;
    }
    setSearchingLocations(true);
    setError(null);
    try {
      const hits = await marketWeatherService.searchLocations(trimmed);
      setSuggestions(hits);
      if (hits.length === 0) {
        setError(t('marketWeather.weather.noLocationMatch', { query: trimmed }));
      } else {
        const top = hits[0];
        await fetchByParams({
          lat: top.latitude,
          lon: top.longitude,
          locationName: [top.name, top.state].filter(Boolean).join(', '),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setSearchingLocations(false);
    }
  };

  const handleSelectSuggestion = (loc: GeoLocationResult) => {
    setSuggestions([]);
    setSearchQuery(loc.name);
    fetchByParams({
      lat: loc.latitude,
      lon: loc.longitude,
      locationName: [loc.name, loc.state].filter(Boolean).join(', '),
    });
  };

  const handleCoordinateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCoordError(null);
    const lat = Number(latInput);
    const lon = Number(lonInput);
    if (
      latInput.trim() === '' ||
      lonInput.trim() === '' ||
      Number.isNaN(lat) ||
      Number.isNaN(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      setCoordError(t('marketWeather.weather.invalidCoordinates'));
      return;
    }
    fetchByParams({ lat, lon });
  };

  const handleUseProfileLocation = () => {
    const fallback = profile?.district || profile?.state || 'Mandya';
    setMode('search');
    setSearchQuery(fallback);
    setSuggestions([]);
    fetchByParams({ q: fallback });
  };

  return (
    <div className="space-y-6">
      {/* Location Selection Card */}
      <div className="rounded-xl border border-[#E5E1D8] bg-white p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-[#17221B]">
              {t('marketWeather.weather.locationHeading')}
            </h2>
            <p className="text-xs text-[#4A5A50] mt-0.5">
              {t('marketWeather.weather.locationSubtitle')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-[#EDEAE2] p-1">
              <button
                type="button"
                onClick={() => setMode('search')}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium cursor-pointer whitespace-nowrap transition-colors',
                  mode === 'search' ? 'bg-white text-[#17221B] shadow-xs' : 'text-[#4A5A50]',
                )}
              >
                {t('marketWeather.weather.modeSearch')}
              </button>
              <button
                type="button"
                onClick={() => setMode('coordinates')}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium cursor-pointer whitespace-nowrap transition-colors',
                  mode === 'coordinates' ? 'bg-white text-[#17221B] shadow-xs' : 'text-[#4A5A50]',
                )}
              >
                {t('marketWeather.weather.modeCoords')}
              </button>
            </div>
            {profile?.district && (
              <Button type="button" variant="secondary" size="sm" onClick={handleUseProfileLocation}>
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {t('marketWeather.weather.savedDistrictBtn', { district: profile.district })}
              </Button>
            )}
          </div>
        </div>

        {mode === 'search' ? (
          <div className="space-y-3">
            <form onSubmit={handleLocationSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#748379]"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('marketWeather.weather.searchPlaceholder')}
                  className={cn(inputBaseClass, 'pl-9')}
                />
              </div>
              <Button type="submit" size="sm" loading={searchingLocations || loading}>
                {t('marketWeather.weather.fetchWeatherBtn')}
              </Button>
            </form>

            {suggestions.length > 1 && (
              <div className="rounded-lg border border-[#E5E1D8] bg-[#FAF8F4] p-3 space-y-2">
                <p className="text-xs font-medium text-[#4A5A50]">
                  {t('marketWeather.weather.matchingLocations')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.slice(0, 6).map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => handleSelectSuggestion(loc)}
                      className="rounded-lg border border-[#E5E1D8] bg-white px-3 py-1.5 text-xs text-[#17221B] hover:border-[#1B4332] cursor-pointer text-left"
                    >
                      <span className="font-semibold">{loc.name}</span>
                      <span className="text-[#748379]">
                        {' '}
                        · {[loc.district, loc.state, loc.countryCode].filter(Boolean).join(', ')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleCoordinateSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField htmlFor="weather-lat" label={t('marketWeather.weather.latitudeLabel')} required>
                <input
                  id="weather-lat"
                  type="number"
                  step="any"
                  value={latInput}
                  onChange={(e) => setLatInput(e.target.value)}
                  placeholder="e.g., 12.5218"
                  className={cn(inputBaseClass, 'font-mono tabular-nums')}
                />
              </FormField>
              <FormField htmlFor="weather-lon" label={t('marketWeather.weather.longitudeLabel')} required>
                <input
                  id="weather-lon"
                  type="number"
                  step="any"
                  value={lonInput}
                  onChange={(e) => setLonInput(e.target.value)}
                  placeholder="e.g., 76.8951"
                  className={cn(inputBaseClass, 'font-mono tabular-nums')}
                />
              </FormField>
            </div>
            {coordError && <p className="text-xs text-[#991B1B] font-medium">{coordError}</p>}
            <div className="flex justify-end">
              <Button type="submit" size="sm" loading={loading}>
                <Compass className="h-3.5 w-3.5" aria-hidden="true" />
                {t('marketWeather.weather.fetchByCoordsBtn')}
              </Button>
            </div>
          </form>
        )}
      </div>

      {error && (
        <ErrorBanner
          message={error}
          onRetry={() => fetchByParams({ q: searchQuery.trim() || profile?.district || 'Mandya' })}
          retryLabel={t('common.retry')}
        />
      )}

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : forecast ? (
        <div className="space-y-6">
          {/* Current Weather Overview + Source Metadata */}
          <section className="rounded-xl border border-[#E5E1D8] bg-white p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E1D8] pb-4">
              <div>
                <h3 className="font-display text-lg font-bold text-[#17221B]">
                  {[forecast.location.name, forecast.location.state].filter(Boolean).join(', ')}
                </h3>
                <p className="text-xs text-[#748379] font-mono tabular-nums mt-0.5">
                  {forecast.location.latitude.toFixed(4)}°N, {forecast.location.longitude.toFixed(4)}°E
                  {forecast.location.elevationM !== null ? ` · ${Math.round(forecast.location.elevationM)} m` : ''}
                  {' · '}
                  {forecast.location.timezone}
                </p>
              </div>
              <div className="text-left sm:text-right text-xs text-[#4A5A50] space-y-1">
                <a
                  href={forecast.attributionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-[#1B4332] hover:underline"
                >
                  <span>{forecast.attributionText}</span>
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
                <p className="text-[#748379] font-mono tabular-nums">
                  {t('marketWeather.weather.forecastPeriodLabel')}: {forecast.forecastPeriod.startDate} →{' '}
                  {forecast.forecastPeriod.endDate} · {t('marketWeather.weather.updatedLabel')}:{' '}
                  {new Date(forecast.updatedAt).toLocaleTimeString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-lg border border-[#E5E1D8] bg-[#FAF8F4] p-4">
                <p className="text-xs text-[#748379] flex items-center gap-1.5">
                  <Thermometer className="h-3.5 w-3.5 text-[#8C5A2B]" aria-hidden="true" />
                  <span>{t('marketWeather.weather.currentTempLabel')}</span>
                </p>
                <p className="mt-2 font-mono text-2xl font-bold text-[#17221B] tabular-nums">
                  {forecast.current.temperatureC !== null ? `${forecast.current.temperatureC.toFixed(1)}°C` : '—'}
                </p>
                <p className="mt-1 text-xs text-[#4A5A50]">
                  {isKn ? forecast.current.conditionKn : forecast.current.conditionEn}
                </p>
              </div>

              <div className="rounded-lg border border-[#E5E1D8] bg-[#FAF8F4] p-4">
                <p className="text-xs text-[#748379] flex items-center gap-1.5">
                  <Droplets className="h-3.5 w-3.5 text-[#1B4332]" aria-hidden="true" />
                  <span>{t('marketWeather.weather.humidityLabel')}</span>
                </p>
                <p className="mt-2 font-mono text-2xl font-bold text-[#17221B] tabular-nums">
                  {forecast.current.relativeHumidityPct !== null
                    ? `${Math.round(forecast.current.relativeHumidityPct)}%`
                    : '—'}
                </p>
                <p className="mt-1 text-xs text-[#4A5A50]">{t('marketWeather.weather.relativeHumidityNote')}</p>
              </div>

              <div className="rounded-lg border border-[#E5E1D8] bg-[#FAF8F4] p-4">
                <p className="text-xs text-[#748379] flex items-center gap-1.5">
                  <Wind className="h-3.5 w-3.5 text-[#2D6A4F]" aria-hidden="true" />
                  <span>{t('marketWeather.weather.windLabel')}</span>
                </p>
                <p className="mt-2 font-mono text-2xl font-bold text-[#17221B] tabular-nums">
                  {forecast.current.windSpeedKmh !== null ? `${forecast.current.windSpeedKmh.toFixed(1)} km/h` : '—'}
                </p>
                <p className="mt-1 text-xs text-[#4A5A50]">{t('marketWeather.weather.windHeightNote')}</p>
              </div>

              <div className="rounded-lg border border-[#E5E1D8] bg-[#FAF8F4] p-4">
                <p className="text-xs text-[#748379] flex items-center gap-1.5">
                  <CloudRain className="h-3.5 w-3.5 text-[#1B4332]" aria-hidden="true" />
                  <span>{t('marketWeather.weather.precipNowLabel')}</span>
                </p>
                <p className="mt-2 font-mono text-2xl font-bold text-[#17221B] tabular-nums">
                  {forecast.current.precipitationMm !== null ? `${forecast.current.precipitationMm.toFixed(1)} mm` : '—'}
                </p>
                <p className="mt-1 text-xs text-[#4A5A50]">
                  {t('marketWeather.weather.observedAt')}: {forecast.current.time.replace('T', ' ')}
                </p>
              </div>
            </div>
          </section>

          {/* Cautious Weather-Based Farming Advisories */}
          <section className="rounded-xl border border-[#E5E1D8] bg-white p-6 space-y-4">
            <div>
              <h3 className="font-display text-base font-semibold text-[#17221B]">
                {t('marketWeather.weather.advisoriesTitle')}
              </h3>
              <p className="text-xs text-[#4A5A50] mt-0.5">
                {t('marketWeather.weather.advisoriesSubtitle')}
              </p>
            </div>

            {forecast.advisories.length === 0 ? (
              <p className="text-sm text-[#4A5A50]">{t('marketWeather.weather.noAdvisories')}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {forecast.advisories.map((adv) => (
                  <div key={adv.code} className="rounded-lg border border-[#E5E1D8] bg-[#FAF8F4] p-4 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#17221B]">
                        {isKn ? adv.titleKn : adv.titleEn}
                      </p>
                      <span
                        className={cn(
                          'text-xs font-mono font-semibold tabular-nums whitespace-nowrap',
                          adv.severity === 'HIGH'
                            ? 'text-[#991B1B]'
                            : adv.severity === 'MODERATE'
                              ? 'text-[#B45309]'
                              : 'text-[#1B4332]',
                        )}
                      >
                        {t(`marketWeather.weather.severity.${adv.severity}`)}
                      </span>
                    </div>
                    <p className="text-xs text-[#4A5A50] leading-relaxed">
                      {isKn ? adv.detailKn : adv.detailEn}
                    </p>
                    <p className="text-[11px] font-mono text-[#748379] tabular-nums">
                      {t('marketWeather.weather.triggerLabel')}: {adv.triggerMetric}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 7-Day Temperature & Rainfall Chart */}
          <section className="rounded-xl border border-[#E5E1D8] bg-white p-6 space-y-4">
            <div>
              <h3 className="font-display text-base font-semibold text-[#17221B]">
                {t('marketWeather.weather.chartTitle')}
              </h3>
              <p className="text-xs text-[#4A5A50] mt-0.5">
                {t('marketWeather.weather.chartSubtitle')}
              </p>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={forecast.daily} margin={{ top: 10, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E1D8" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#4A5A50' }} />
                  <YAxis
                    yAxisId="temp"
                    tick={{ fontSize: 11, fill: '#4A5A50' }}
                    tickFormatter={(v) => `${v}°`}
                    width={42}
                  />
                  <YAxis
                    yAxisId="rain"
                    orientation="right"
                    tick={{ fontSize: 11, fill: '#1B4332' }}
                    tickFormatter={(v) => `${v}mm`}
                    width={48}
                  />
                  <Tooltip contentStyle={{ borderRadius: '8px', borderColor: '#E5E1D8', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar
                    yAxisId="rain"
                    dataKey="precipitationSumMm"
                    name={t('marketWeather.weather.cols.precip')}
                    fill="#A7C4B5"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="temp"
                    type="monotone"
                    dataKey="tempMaxC"
                    name={t('marketWeather.weather.cols.maxTemp')}
                    stroke="#8C5A2B"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    yAxisId="temp"
                    type="monotone"
                    dataKey="tempMinC"
                    name={t('marketWeather.weather.cols.minTemp')}
                    stroke="#1B4332"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* 7-Day Daily Table */}
            <div className="overflow-x-auto border-t border-[#E5E1D8] pt-4">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#E5E1D8] bg-[#FAF8F4] text-xs font-semibold text-[#4A5A50]">
                  <tr>
                    <th className="px-4 py-2.5">{t('marketWeather.weather.cols.date')}</th>
                    <th className="px-4 py-2.5">{t('marketWeather.weather.cols.condition')}</th>
                    <th className="px-4 py-2.5 text-right">{t('marketWeather.weather.cols.minMaxTemp')}</th>
                    <th className="px-4 py-2.5 text-right">{t('marketWeather.weather.cols.precip')}</th>
                    <th className="px-4 py-2.5 text-right">{t('marketWeather.weather.cols.rainProb')}</th>
                    <th className="px-4 py-2.5 text-right">{t('marketWeather.weather.cols.maxWind')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E1D8]">
                  {forecast.daily.map((day) => (
                    <tr key={day.date} className="hover:bg-[#FAF8F4]/70">
                      <td className="px-4 py-3 font-mono text-xs tabular-nums text-[#17221B]">
                        {day.date}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#4A5A50]">
                        {isKn ? day.conditionKn : day.conditionEn}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-[#17221B]">
                        {day.tempMinC !== null ? `${day.tempMinC.toFixed(1)}°` : '—'} /{' '}
                        {day.tempMaxC !== null ? `${day.tempMaxC.toFixed(1)}°C` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-[#1B4332]">
                        {day.precipitationSumMm !== null ? `${day.precipitationSumMm.toFixed(1)} mm` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-[#4A5A50]">
                        {day.precipitationProbabilityMaxPct !== null
                          ? `${day.precipitationProbabilityMaxPct}%`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-[#4A5A50]">
                        {day.windSpeedMaxKmh !== null ? `${day.windSpeedMaxKmh.toFixed(1)} km/h` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
