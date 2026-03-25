import { useMemo } from 'react';

import { useDashboardDataContext } from '@/context/DashboardDataContext';
import { toTimetableEntries } from '@/lib/academia-ui';

export function useTimetable() {
  const { timetable: timetableRaw, loading, error } = useDashboardDataContext();
  const timetable = useMemo(() => toTimetableEntries(timetableRaw), [timetableRaw]);

  return { timetable, timetableRaw, loading, error };
}
