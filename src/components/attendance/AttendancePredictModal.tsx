'use client';

import React, { memo, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';

import { combineAttendanceSubjects } from '@/lib/academia-ui';
import type { RawAttendanceItem } from '@/lib/server/academia';
import type { Subject } from '@/lib/types';
import { cn } from '@/lib/utils';

type PredictionMode = 'leaves' | 'attending';
type SelectionMode = 'single' | 'range';
type ModalStep = 'picker' | 'results';

interface AttendancePredictModalProps {
  open: boolean;
  attendanceList: RawAttendanceItem[];
  loading?: boolean;
  onClose: () => void;
}

interface AttendancePredictionResult {
  courseCode: string;
  courseTitle: string;
  attendanceComponent: 'theory' | 'practical';
  attendance: number;
  status: 'safe' | 'danger';
  margin: number;
  required: number;
  conducted: number;
  attended: number;
  accentColor: string;
  accentGlow: string;
}

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateKey(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function isSameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function addDays(date: Date, value: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + value);
  return next;
}

function getRangeKeys(start: Date, end: Date) {
  const normalizedStart = start <= end ? start : end;
  const normalizedEnd = start <= end ? end : start;
  const keys: string[] = [];
  let cursor = new Date(normalizedStart);

  while (cursor <= normalizedEnd) {
    keys.push(formatDateKey(cursor));
    cursor = addDays(cursor, 1);
  }

  return keys;
}

function getCalendarGrid(month: Date) {
  const monthStart = getMonthStart(month);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const leadingEmptyCells = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();

  return [
    ...Array.from({ length: leadingEmptyCells }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => addDays(monthStart, index)),
  ];
}

function toPredictionResults(
  attendanceSubjects: Subject[],
  totalDays: number,
  mode: PredictionMode,
): AttendancePredictionResult[] {
  return attendanceSubjects.map((item) => {
    const conducted = item.attendance.total;
    const attended = item.attendance.attended;
    const newTotal = conducted + totalDays;
    const newAttended = mode === 'attending' ? attended + totalDays : attended;
    const newAttendance = newTotal ? (newAttended / newTotal) * 100 : 0;
    const margin = Math.max(0, Math.floor((newAttended / 0.75) - newTotal));
    const required = Math.max(0, Math.ceil(((0.75 * newTotal) - newAttended) / 0.25));
    let accentColor = 'var(--accent)';
    let accentGlow = '0 0 22px rgba(255, 138, 91, 0.2)';

    if (newAttendance < 75) {
      accentColor = 'var(--error)';
      accentGlow = '0 0 22px rgba(255, 122, 104, 0.22)';
    } else if (margin === 0) {
      accentColor = 'var(--accent)';
      accentGlow = '0 0 22px rgba(255, 138, 91, 0.2)';
    } else {
      accentColor = 'var(--warning)';
      accentGlow = '0 0 22px rgba(255, 204, 105, 0.2)';
    }

    return {
      courseCode: item.code,
      courseTitle: item.name,
      attendanceComponent: item.attendanceComponent ?? 'theory',
      attendance: newAttendance,
      status: newAttendance >= 75 ? 'safe' : 'danger',
      margin,
      required,
      conducted: newTotal,
      attended: newAttended,
      accentColor,
      accentGlow,
    };
  });
}

const weekdayLabels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function AttendancePredictModal({
  open,
  attendanceList,
  loading = false,
  onClose,
}: AttendancePredictModalProps) {
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);
  const [visibleMonth, setVisibleMonth] = useState(() => getMonthStart(today));
  const [predictionMode, setPredictionMode] = useState<PredictionMode>('leaves');
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('single');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [step, setStep] = useState<ModalStep>('picker');
  const attendanceSubjects = useMemo(
    () => combineAttendanceSubjects(attendanceList).sort((left, right) => {
      const componentPriority = left.attendanceComponent === right.attendanceComponent
        ? 0
        : left.attendanceComponent === 'practical'
          ? 1
          : -1;
      if (componentPriority !== 0) return componentPriority;

      const leftPriority = left.attendance.percentage < 75 ? 0 : 1;
      const rightPriority = right.attendance.percentage < 75 ? 0 : 1;
      if (leftPriority !== rightPriority) return leftPriority - rightPriority;

      return left.attendance.percentage - right.attendance.percentage;
    }),
    [attendanceList],
  );

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    document.body.classList.add('predictor-open');

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
      document.body.classList.remove('predictor-open');
    };
  }, [open]);

  const calendarDays = useMemo(() => getCalendarGrid(visibleMonth), [visibleMonth]);
  const totalDaysSelected = selectedKeys.length;
  const results = useMemo(
    () => toPredictionResults(attendanceSubjects, totalDaysSelected, predictionMode),
    [attendanceSubjects, predictionMode, totalDaysSelected],
  );
  const theoryResults = useMemo(
    () => results.filter((item) => item.attendanceComponent !== 'practical'),
    [results],
  );
  const practicalResults = useMemo(
    () => results.filter((item) => item.attendanceComponent === 'practical'),
    [results],
  );

  function resetState() {
    setPredictionMode('leaves');
    setSelectionMode('single');
    setSelectedKeys([]);
    setRangeStart(null);
    setStep('picker');
    setVisibleMonth(getMonthStart(today));
  }

  function handleClose() {
    resetState();
    onClose();
  }

  function toggleSingleDate(key: string) {
    setSelectedKeys((current) => (
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key].sort()
    ));
  }

  function handleDateSelection(date: Date) {
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (normalizedDate < today) return;

    const key = formatDateKey(normalizedDate);

    if (selectionMode === 'single') {
      toggleSingleDate(key);
      return;
    }

    if (!rangeStart) {
      setRangeStart(key);
      setSelectedKeys([key]);
      return;
    }

    const keys = getRangeKeys(parseDateKey(rangeStart), normalizedDate);
    setSelectedKeys(keys);
    setRangeStart(null);
  }

  function showPreviousMonth() {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  function showNextMonth() {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  function handleSelectionModeChange(mode: SelectionMode) {
    setSelectionMode(mode);
    setRangeStart(null);
    setSelectedKeys([]);
  }

  function handleConfirm() {
    if (!selectedKeys.length) return;
    setStep('results');
  }

  const actionLabel = predictionMode === 'leaves' ? 'leave days selected' : 'attending days selected';

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[999] flex min-h-screen w-full items-end justify-center overflow-hidden bg-black/70 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          <motion.div
            className="relative flex h-[100dvh] w-full max-w-[28rem] touch-pan-y flex-col overflow-hidden border px-4 pb-6 pt-5 overscroll-contain sm:max-w-[34rem] sm:px-6 lg:max-w-[44rem] xl:max-w-[52rem]"
            style={{
              background: 'linear-gradient(180deg, color-mix(in srgb, var(--surface) 96%, black 4%) 0%, color-mix(in srgb, var(--surface-soft) 94%, transparent) 100%)',
              borderColor: 'var(--border-strong)',
              boxShadow: '0 28px 80px rgba(0,0,0,0.45)',
            }}
            initial={{ y: '100%', opacity: 0.9 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.9 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-48 opacity-70" style={{ background: 'var(--hero-gradient)' }} />

            <div className="relative z-10 flex items-start justify-between gap-4">
              <div>
                <p className="theme-kicker">predict</p>
                <h2 className="mt-2 font-headline text-[2.6rem] font-bold leading-[0.9] tracking-tight text-on-surface">
                  PREDICT
                </h2>
                <p className="mt-2 text-sm text-on-surface-variant">plan your leaves</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="theme-icon-button flex items-center justify-center"
                aria-label="Close attendance predictor"
              >
                <X size={18} />
              </button>
            </div>

            {step === 'picker' ? (
              <div className="relative z-10 mt-6 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain pb-2">
                <div className="grid grid-cols-2 gap-3">
                  {(['leaves', 'attending'] as const).map((mode) => {
                    const active = predictionMode === mode;

                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPredictionMode(mode)}
                        className={cn(
                          'rounded-[24px] border px-4 py-3 font-label text-[11px] font-bold uppercase tracking-[0.22em] transition-all',
                          active ? 'text-[var(--text-inverse)] shadow-[var(--glow-primary)]' : 'text-on-surface-variant',
                        )}
                        style={active ? {
                          background: 'var(--primary)',
                          borderColor: 'var(--primary)',
                        } : {
                          background: 'color-mix(in srgb, var(--surface-soft) 90%, transparent)',
                          borderColor: 'var(--border)',
                        }}
                      >
                        {mode}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <SelectionButton
                    active={selectionMode === 'single'}
                    label="single day"
                    onClick={() => handleSelectionModeChange('single')}
                  />
                  <SelectionButton
                    active={selectionMode === 'range'}
                    label="date range"
                    onClick={() => handleSelectionModeChange('range')}
                  />
                </div>

                <div
                  className="flex flex-none flex-col rounded-[32px] border p-5"
                  style={{
                    background: 'color-mix(in srgb, var(--surface-soft) 88%, transparent)',
                    borderColor: 'color-mix(in srgb, var(--primary) 18%, var(--border))',
                    boxShadow: 'var(--elevation-card)',
                  }}
                >
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <button type="button" onClick={showPreviousMonth} className="theme-icon-button flex items-center justify-center">
                      <ChevronLeft size={18} />
                    </button>
                    <div className="text-center">
                      <p className="font-headline text-xl font-bold text-on-surface">
                        {visibleMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-on-surface-variant">
                        {selectionMode === 'range' && rangeStart ? 'select end date' : 'tap to select'}
                      </p>
                    </div>
                    <button type="button" onClick={showNextMonth} className="theme-icon-button flex items-center justify-center">
                      <ChevronRight size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-2 text-center">
                    {weekdayLabels.map((label) => (
                      <span key={label} className="font-label text-[9px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                        {label}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-7 gap-2">
                    {calendarDays.map((date, index) => {
                      if (!date) {
                        return <div key={`empty-${index}`} aria-hidden="true" className="aspect-square" />;
                      }

                      const key = formatDateKey(date);
                      const selected = selectedKeys.includes(key);
                      const disabled = date < today;
                      const isToday = isSameDay(date, today);

                      return (
                        <button
                          key={key}
                          type="button"
                          disabled={disabled}
                          onClick={() => handleDateSelection(date)}
                          className={cn(
                            'relative flex aspect-square items-center justify-center rounded-[18px] border text-sm font-semibold transition-all',
                            disabled && 'cursor-not-allowed opacity-35',
                            !disabled && !selected && 'hover:-translate-y-0.5',
                            !selected && 'text-on-surface',
                          )}
                          style={selected ? {
                            background: 'color-mix(in srgb, var(--primary) 24%, transparent)',
                            borderColor: 'var(--primary)',
                            boxShadow: 'var(--glow-primary)',
                            color: 'var(--primary)',
                          } : {
                            background: isToday
                              ? 'color-mix(in srgb, var(--secondary) 10%, transparent)'
                              : 'color-mix(in srgb, var(--surface-elevated) 84%, transparent)',
                            borderColor: isToday
                              ? 'color-mix(in srgb, var(--secondary) 28%, transparent)'
                              : 'var(--border)',
                          }}
                        >
                          {date.getDate()}
                          {isToday && !selected ? (
                            <span className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full bg-secondary shadow-[var(--glow-secondary)]" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div
                  className="shrink-0 rounded-[28px] border p-5"
                  style={{
                    background: 'color-mix(in srgb, var(--surface-soft) 92%, transparent)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="theme-kicker">{actionLabel}</p>
                      <p className="mt-2 font-headline text-3xl font-bold text-on-surface">{totalDaysSelected}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleConfirm}
                      disabled={!selectedKeys.length || loading}
                      className="rounded-[22px] px-5 py-3 font-label text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--text-inverse)] transition-all disabled:cursor-not-allowed disabled:opacity-45"
                      style={{
                        background: 'var(--primary)',
                        boxShadow: 'var(--glow-primary)',
                      }}
                    >
                      confirm
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative z-10 mt-6 flex min-h-0 flex-1 flex-col gap-5">
                <div
                  className="rounded-[28px] border px-5 py-4"
                  style={{
                    background: 'color-mix(in srgb, var(--surface-soft) 92%, transparent)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="theme-kicker">prediction summary</p>
                      <p className="mt-2 text-sm text-on-surface-variant">
                        {totalDaysSelected} {predictionMode === 'leaves' ? 'future leave' : 'future attendance'} day{totalDaysSelected === 1 ? '' : 's'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep('picker')}
                      className="rounded-[18px] border px-3 py-2 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface"
                      style={{ borderColor: 'var(--border)', background: 'var(--surface-elevated)' }}
                    >
                      edit dates
                    </button>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
                  <div className="space-y-4">
                    {theoryResults.map((item) => <PredictionCard key={`${item.courseCode}-${item.courseTitle}`} item={item} />)}
                  </div>
                  {practicalResults.length ? (
                    <div className="mt-8 space-y-4">
                      <p className="theme-kicker px-1">practical</p>
                      {practicalResults.map((item) => <PredictionCard key={`${item.courseCode}-${item.courseTitle}`} item={item} />)}
                    </div>
                  ) : null}
                </div>

                <div
                  className="flex items-center justify-between gap-4 rounded-[24px] border px-5 py-4"
                  style={{
                    background: 'color-mix(in srgb, var(--surface-soft) 94%, transparent)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <div className="flex items-center gap-3 text-on-surface-variant">
                    <CalendarDays size={18} className="text-primary" />
                    <span className="text-sm">{selectedKeys.length} dates applied locally</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-[18px] px-4 py-2 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-inverse)]"
                    style={{ background: 'var(--primary)', boxShadow: 'var(--glow-primary)' }}
                  >
                    done
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

function SelectionButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-[22px] border px-4 py-3 font-label text-[10px] font-bold uppercase tracking-[0.18em] transition-all',
        active ? 'text-primary shadow-[var(--glow-primary)]' : 'text-on-surface-variant',
      )}
      style={active ? {
        background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
        borderColor: 'color-mix(in srgb, var(--primary) 26%, transparent)',
      } : {
        background: 'color-mix(in srgb, var(--surface-soft) 88%, transparent)',
        borderColor: 'var(--border)',
      }}
    >
      {label}
    </button>
  );
}

function PredictionCard({ item }: { item: AttendancePredictionResult }) {
  return (
    <div
      className="relative rounded-[30px] border p-5"
      style={{
        background: 'linear-gradient(180deg, color-mix(in srgb, var(--accent) 8%, var(--surface)) 0%, color-mix(in srgb, var(--surface) 96%, transparent) 100%)',
        borderColor: 'color-mix(in srgb, var(--accent) 18%, var(--border))',
        boxShadow: item.accentGlow,
      }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[30px]"
        style={{
          background: item.accentColor,
          boxShadow: `0 0 15px ${item.accentColor}`,
        }}
      />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-headline text-[1.55rem] font-bold lowercase leading-[0.98] text-on-surface">
            {item.courseTitle.toLowerCase()}
          </h3>
          <p className="mt-2 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
            {item.attended} of {item.conducted} sessions attended
          </p>
          <span
            className="mt-3 inline-flex rounded-full border px-3 py-1 font-label text-[9px] font-bold uppercase tracking-[0.18em]"
            style={{
              color: item.accentColor,
              borderColor: `color-mix(in srgb, ${item.accentColor} 30%, transparent)`,
              background: `color-mix(in srgb, ${item.accentColor} 14%, transparent)`,
            }}
          >
            {item.status === 'safe' ? `margin: ${item.margin}` : `required: ${item.required}`}
          </span>
        </div>
        <span
          className="shrink-0 font-headline text-[2.3rem] font-bold leading-none tracking-tight"
          style={{ color: item.accentColor }}
        >
          {item.attendance.toFixed(1)}%
        </span>
      </div>

      <div
        className="mt-5 h-3 overflow-hidden rounded-full"
        style={{ background: 'color-mix(in srgb, var(--surface-elevated) 84%, transparent)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, item.attendance)}%`,
            background: item.accentColor,
            boxShadow: item.accentGlow,
          }}
        />
      </div>
    </div>
  );
}

export default memo(AttendancePredictModal);
