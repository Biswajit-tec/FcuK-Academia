import { useDashboardDataContext } from '@/context/DashboardDataContext';

export function useDashboard() {
  const { userInfo, attendance, markList, timetable, calendar, loading, refreshing, isStale, error } = useDashboardDataContext();
  return { user: userInfo, attendance, marks: markList, timetable, calendar, loading, refreshing, isStale, error };
}
