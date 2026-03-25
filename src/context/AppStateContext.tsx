'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';

import {
  getCalendarDayByKey,
  getCalendarDayForDayOrder,
  getCalendarDayOrders,
  getCurrentCalendarMonth,
  getFirstCalendarDayWithDayOrder,
  getTodayCalendarItem,
} from '@/lib/academia-ui';
import type { RawCalendarMonth } from '@/lib/server/academia';
import { useDashboardDataContext } from '@/context/DashboardDataContext';

type CalendarSelection = { month: string; date: string };

interface AppStateContextType {
  calendar: RawCalendarMonth[];
  calendarLoading: boolean;
  calendarError: string | null;
  activeDayOrder: number | null;
  availableDayOrders: number[];
  dayOrderSource: 'calendar';
  selectedCalendarDay: CalendarSelection | null;
  setSelectedCalendarDay: (selection: CalendarSelection, dayOrder?: number | null) => void;
  setActiveDayOrder: (dayOrder: number) => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

function getDefaultCalendarSelection(calendar: RawCalendarMonth[], activeDayOrder: number | null) {
  const preferredMonth = getCurrentCalendarMonth(calendar)?.month ?? null;
  const byActiveOrder = activeDayOrder
    ? getCalendarDayForDayOrder(calendar, activeDayOrder, preferredMonth)
    : null;
  if (byActiveOrder) return byActiveOrder;

  const currentMonth = getCurrentCalendarMonth(calendar);
  const today = getTodayCalendarItem(calendar);
  if (currentMonth && today) {
    return { month: currentMonth.month, day: today };
  }

  return getFirstCalendarDayWithDayOrder(calendar);
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const {
    calendar,
    loading: calendarLoading,
    error: calendarError,
  } = useDashboardDataContext();
  const [selectedCalendarDayState, setSelectedCalendarDayState] = useState<CalendarSelection | null>(null);
  const [activeDayOrderState, setActiveDayOrderState] = useState<number | null>(null);

  const availableDayOrders = useMemo(() => getCalendarDayOrders(calendar), [calendar]);
  const fallbackSelection = useMemo(
    () => getDefaultCalendarSelection(calendar, activeDayOrderState),
    [activeDayOrderState, calendar],
  );
  const selectedDay = useMemo(
    () => (selectedCalendarDayState ? getCalendarDayByKey(calendar, selectedCalendarDayState) : null),
    [calendar, selectedCalendarDayState],
  );
  const selectedCalendarDay = useMemo(() => {
    if (selectedDay) {
      return { month: selectedDay.month, date: selectedDay.day.date };
    }

    if (fallbackSelection) {
      return { month: fallbackSelection.month, date: fallbackSelection.day.date };
    }

    return null;
  }, [fallbackSelection, selectedDay]);
  const activeDayOrder = useMemo(() => {
    const selectedDayOrder = Number(selectedDay?.day.dayOrder);
    if (!Number.isNaN(selectedDayOrder) && selectedDayOrder > 0) {
      return selectedDayOrder;
    }

    if (activeDayOrderState !== null && availableDayOrders.includes(activeDayOrderState)) {
      return activeDayOrderState;
    }

    const fallbackDayOrder = Number(fallbackSelection?.day.dayOrder);
    if (!Number.isNaN(fallbackDayOrder) && fallbackDayOrder > 0) {
      return fallbackDayOrder;
    }

    return null;
  }, [activeDayOrderState, availableDayOrders, fallbackSelection, selectedDay]);

  function setSelectedCalendarDay(selection: CalendarSelection, dayOrder?: number | null) {
    setSelectedCalendarDayState(selection);

    if (typeof dayOrder === 'number' && dayOrder > 0) {
      setActiveDayOrderState(dayOrder);
    }
  }

  function setActiveDayOrder(dayOrder: number) {
    if (Number.isNaN(dayOrder) || dayOrder <= 0) return;

    const preferredMonth = selectedCalendarDay?.month ?? getCurrentCalendarMonth(calendar)?.month ?? null;
    const target = getCalendarDayForDayOrder(calendar, dayOrder, preferredMonth);
    if (!target) return;

    setSelectedCalendarDayState({ month: target.month, date: target.day.date });
    setActiveDayOrderState(dayOrder);
  }

  return (
    <AppStateContext.Provider
      value={{
        calendar,
        calendarLoading,
        calendarError,
        activeDayOrder,
        availableDayOrders,
        dayOrderSource: 'calendar',
        selectedCalendarDay,
        setSelectedCalendarDay,
        setActiveDayOrder,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }

  return context;
}
