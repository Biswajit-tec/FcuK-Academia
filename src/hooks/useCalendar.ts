import { useAppState } from '@/context/AppStateContext';

export function useCalendar() {
  const { calendar, calendarLoading, calendarError } = useAppState();
  return { calendar, loading: calendarLoading, error: calendarError };
}
