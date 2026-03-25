import { useMemo } from 'react';

import { useDashboardDataContext } from '@/context/DashboardDataContext';
import { combineAttendanceSubjects } from '@/lib/academia-ui';

export function useAttendance() {
  const { attendance, loading, error } = useDashboardDataContext();
  const attendanceList = attendance;
  const subjects = useMemo(() => combineAttendanceSubjects(attendanceList), [attendanceList]);

  return { attendance: subjects, attendanceList, loading, error };
}
