import { useEffect, useState } from 'react';

import { ApiError, fetchJson, peekCachedJson } from '@/lib/api/client';
import type { DashboardData } from '@/lib/api/types';
import type { RawAttendanceItem, RawCalendarMonth, RawMarkItem, RawTimetableItem, RawUserInfo } from '@/lib/server/academia';

export function useDashboard() {
  const cachedDashboard = peekCachedJson<DashboardData>('/api/dashboard');
  const [user, setUser] = useState<RawUserInfo | null>(cachedDashboard?.userInfo ?? null);
  const [attendance, setAttendance] = useState<RawAttendanceItem[]>(cachedDashboard?.attendance ?? []);
  const [marks, setMarks] = useState<RawMarkItem[]>(cachedDashboard?.markList ?? []);
  const [timetable, setTimetable] = useState<RawTimetableItem[]>(cachedDashboard?.timetable ?? []);
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
        setUser(data.userInfo);
        setAttendance(data.attendance);
        setMarks(data.markList);
        setTimetable(data.timetable);
        setCalendar(data.calendar);
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

  return { user, attendance, marks, timetable, calendar, loading, error };
}
