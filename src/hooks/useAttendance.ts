import { useEffect, useMemo, useState } from 'react';

import { fetchJson, ApiError, peekCachedJson } from '@/lib/api/client';
import type { DashboardData } from '@/lib/api/types';
import { combineSubjects } from '@/lib/academia-ui';
import type { RawAttendanceItem, RawMarkItem } from '@/lib/server/academia';

const EMPTY_MARKS: RawMarkItem[] = [];

export function useAttendance(markSeed: RawMarkItem[] = EMPTY_MARKS) {
  const cachedDashboard = peekCachedJson<DashboardData>('/api/dashboard');
  const [attendanceList, setAttendanceList] = useState<RawAttendanceItem[]>(cachedDashboard?.attendance ?? []);
  const [markList, setMarkList] = useState<RawMarkItem[]>(markSeed.length ? markSeed : (cachedDashboard?.markList ?? markSeed));
  const [loading, setLoading] = useState(!cachedDashboard);
  const [error, setError] = useState<string | null>(null);
  const markSeedKey = JSON.stringify(markSeed);
  const resolvedMarkSeed = useMemo(
    () => JSON.parse(markSeedKey) as RawMarkItem[],
    [markSeedKey],
  );

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading((current) => current && !cachedDashboard);
        setError(null);
        const data = await fetchJson<DashboardData>('/api/dashboard');

        if (!active) return;
        setAttendanceList(data.attendance);
        setMarkList(resolvedMarkSeed.length ? resolvedMarkSeed : data.markList);
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
  }, [markSeedKey, cachedDashboard, resolvedMarkSeed]);

  const attendance = useMemo(() => combineSubjects(attendanceList, markList), [attendanceList, markList]);

  return { attendance, attendanceList, loading, error };
}
