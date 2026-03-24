import { useEffect, useState } from 'react';

import { fetchJson, ApiError, peekCachedJson } from '@/lib/api/client';
import type { DashboardData } from '@/lib/api/types';
import { toUserProfile } from '@/lib/academia-ui';

export function useUser() {
  const cachedDashboard = peekCachedJson<DashboardData>('/api/dashboard');
  const [user, setUser] = useState<DashboardData['userInfo'] | null>(cachedDashboard?.userInfo ?? null);
  const [loading, setLoading] = useState(!cachedDashboard);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading((current) => current && !cachedDashboard);
        setError(null);
        const data = await fetchJson<DashboardData>('/api/dashboard');
        if (!active) return;
        setUser(data.userInfo);
      } catch (err) {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : 'server error');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [cachedDashboard]);

  return {
    user,
    profile: user ? toUserProfile(user) : null,
    loading,
    error,
  };
}
