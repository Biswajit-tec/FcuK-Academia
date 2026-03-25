import { useMemo } from 'react';

import { useDashboardDataContext } from '@/context/DashboardDataContext';
import { combineSubjects } from '@/lib/academia-ui';
import type { RawMarkItem } from '@/lib/server/academia';

const EMPTY_MARKS: RawMarkItem[] = [];

export function useAttendance(markSeed: RawMarkItem[] = EMPTY_MARKS) {
  const { attendance, markList: dashboardMarkList, loading, error } = useDashboardDataContext();
  const markSeedKey = JSON.stringify(markSeed);
  const resolvedMarkSeed = useMemo(() => JSON.parse(markSeedKey) as RawMarkItem[], [markSeedKey]);
  const markList = resolvedMarkSeed.length ? resolvedMarkSeed : dashboardMarkList;

  const attendanceList = attendance;
  const subjects = useMemo(() => combineSubjects(attendanceList, markList), [attendanceList, markList]);

  return { attendance: subjects, attendanceList, loading, error };
}
