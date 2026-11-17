import { useCallback, useEffect, useState } from 'react';
import { marketWeatherService } from '../services/marketWeatherService';
import type { SmartAlertsResponse } from '../types/marketWeather';

export function useSmartAlerts(enabled: boolean) {
  const [data, setData] = useState<SmartAlertsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await marketWeatherService.getSmartAlerts();
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'errors.generic');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    data,
    alerts: data?.alerts || [],
    loading,
    error,
    reload,
  };
}
