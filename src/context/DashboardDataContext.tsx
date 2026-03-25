'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { ApiError, fetchJson, peekCachedJson } from '@/lib/api/client';
import type { DashboardData } from '@/lib/api/types';
import type { RawAttendanceItem, RawCalendarMonth, RawMarkItem, RawTimetableItem, RawUserInfo } from '@/lib/server/academia';

interface DashboardDataContextValue {
  userInfo: RawUserInfo | null;
  attendance: RawAttendanceItem[];
  markList: RawMarkItem[];
  timetable: RawTimetableItem[];
  calendar: RawCalendarMonth[];
  loading: boolean;
  error: string | null;
}

const DashboardDataContext = createContext<DashboardDataContextValue | undefined>(undefined);

export function DashboardDataProvider({ children }: { children: React.ReactNode }) {
  const cachedDashboard = peekCachedJson<DashboardData>('/api/dashboard');
  const [userInfo, setUserInfo] = useState<RawUserInfo | null>(cachedDashboard?.userInfo ?? null);
  const [attendance, setAttendance] = useState<RawAttendanceItem[]>(cachedDashboard?.attendance ?? []);
  const [markList, setMarkList] = useState<RawMarkItem[]>(cachedDashboard?.markList ?? []);
  const [timetable, setTimetable] = useState<RawTimetableItem[]>(cachedDashboard?.timetable ?? []);
  const [calendar, setCalendar] = useState<RawCalendarMonth[]>(cachedDashboard?.calendar ?? []);
  const [loading, setLoading] = useState(!cachedDashboard);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        setLoading((current) => current && !cachedDashboard);
        setError(null);
        const data = await fetchJson<DashboardData>(`/api/dashboard?ts=${Date.now()}`);
        if (!active) return;

        setUserInfo(data.userInfo);
        setAttendance(data.attendance);
        setMarkList(data.markList);
        setTimetable(data.timetable);
        setCalendar(data.calendar);
      } catch (loadError) {
        if (!active) return;

        if (cachedDashboard) {
          setUserInfo(cachedDashboard.userInfo);
          setAttendance(cachedDashboard.attendance);
          setMarkList(cachedDashboard.markList);
          setTimetable(cachedDashboard.timetable);
          setCalendar(cachedDashboard.calendar);
          setError(null);
        } else {
          setError(loadError instanceof ApiError ? loadError.message : 'server error');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, [cachedDashboard]);

  const value = useMemo(
    () => ({
      userInfo,
      attendance,
      markList,
      timetable,
      calendar,
      loading,
      error,
    }),
    [attendance, calendar, error, loading, markList, timetable, userInfo],
  );

  return (
    <DashboardDataContext.Provider value={value}>
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardDataContext() {
  const context = useContext(DashboardDataContext);
  if (!context) {
    throw new Error('useDashboardDataContext must be used within a DashboardDataProvider');
  }

  return context;
}
