import { useMemo } from 'react';

import { useDashboardDataContext } from '@/context/DashboardDataContext';
import { combineSubjects } from '@/lib/academia-ui';
import type { RawAttendanceItem } from '@/lib/server/academia';

const EMPTY_ATTENDANCE: RawAttendanceItem[] = [];

export function useMarks(attendanceSeed: RawAttendanceItem[] = EMPTY_ATTENDANCE) {
  const { attendance: dashboardAttendance, markList, loading, error } = useDashboardDataContext();
  const attendanceSeedKey = JSON.stringify(attendanceSeed);
  const resolvedAttendanceSeed = useMemo(() => JSON.parse(attendanceSeedKey) as RawAttendanceItem[], [attendanceSeedKey]);
  const attendance = resolvedAttendanceSeed.length ? resolvedAttendanceSeed : dashboardAttendance;

  const marks = useMemo(() => combineSubjects(attendance, markList), [attendance, markList]);

  return { marks, markList, loading, error };
}
