import { useCallback, useEffect, useState } from 'react';
import { ApiClientError } from '../services/apiClient';
import { farmerService } from '../services/farmerService';
import type { FarmerProfile } from '../types/farmer';

export function useFarmerProfile(enabled: boolean) {
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await farmerService.getProfile();
      setProfile(data);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 404) {
        setProfile(null);
      } else {
        setError(err instanceof Error ? err.message : 'errors.generic');
      }
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    setProfile,
    loading,
    error,
    reload: fetchProfile,
  };
}
