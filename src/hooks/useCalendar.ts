import { useEffect, useState } from 'react';

import { fetchJson, ApiError, peekCachedJson } from '@/lib/api/client';
import type { CalendarResponse, DashboardData } from '@/lib/api/types';
import type { RawCalendarMonth } from '@/lib/server/academia';

export function useCalendar() {
  const cachedDashboard = peekCachedJson<DashboardData>('/api/dashboard');
  const [calendar, setCalendar] = useState<RawCalendarMonth[]>(cachedDashboard?.calendar ?? []);
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
        if (data.calendar.length) {
          setCalendar(data.calendar);
          return;
        }

        const calendarData = await fetchJson<CalendarResponse>(`/api/calendar?ts=${Date.now()}`);
        if (!active) return;
        setCalendar(calendarData.calendar);
      } catch (err) {
        if (!active) return;
        try {
          const calendarData = await fetchJson<CalendarResponse>(`/api/calendar?ts=${Date.now()}`);
          if (!active) return;
          setCalendar(calendarData.calendar);
          setError(null);
        } catch (calendarErr) {
          if (!active) return;
          setError(calendarErr instanceof ApiError ? calendarErr.message : (err instanceof ApiError ? err.message : 'server error'));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [cachedDashboard]);

  return { calendar, loading, error };
}
