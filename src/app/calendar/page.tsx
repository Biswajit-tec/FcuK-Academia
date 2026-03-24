'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Bell, ChevronLeft, ChevronRight } from 'lucide-react';

import CountUp from '@/components/ui/CountUp';
import GlassCard from '@/components/ui/GlassCard';
import { PageReveal, RevealHeading, RevealItem, RevealText } from '@/components/ui/PageReveal';
import { cn } from '@/lib/utils';
import { useCalendar } from '@/hooks/useCalendar';
import { useUser } from '@/hooks/useUser';
import {
  createAvatarUrl,
  formatMonthTitle,
  getCurrentCalendarMonth,
  getTodayCalendarItem,
} from '@/lib/academia-ui';
import type { RawCalendarMonth } from '@/lib/server/academia';

const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

type CalendarTone = 'default' | 'holiday' | 'exam' | 'event';

function getDayKey(month: string, date: string) {
  return `${month}-${date}`;
}

function getCalendarTone(event: string, day?: string) {
  const normalized = event.toLowerCase().trim();
  if ((!normalized || normalized === '-') && /^sat/i.test(day || '')) return 'holiday' as CalendarTone;
  if (!normalized || normalized === '-') return 'default' as CalendarTone;
  if (/(holiday|leave|vacation|break|festival|closed|holi)/i.test(normalized)) return 'holiday' as CalendarTone;
  if (/exam|test|assessment|quiz|cat|fat/i.test(normalized)) return 'exam' as CalendarTone;
  return 'event' as CalendarTone;
}

function getMonthIndex(calendar: RawCalendarMonth[], targetMonth: RawCalendarMonth | null) {
  if (!calendar.length || !targetMonth) return 0;
  const index = calendar.findIndex((month) => month.month === targetMonth.month);
  return index >= 0 ? index : 0;
}

export default function CalendarPage() {
  const { calendar, loading, error } = useCalendar();
  const { user } = useUser();
  const avatarUrl = createAvatarUrl(user?.name || 'SRM Student');
  const derivedCurrentMonth = getCurrentCalendarMonth(calendar) ?? calendar[0] ?? null;
  const derivedToday = getTodayCalendarItem(calendar) ?? derivedCurrentMonth?.days.find((item) => item.dayOrder && item.dayOrder !== '-') ?? derivedCurrentMonth?.days[0] ?? null;
  const initialMonthIndex = useMemo(
    () => getMonthIndex(calendar, derivedCurrentMonth),
    [calendar, derivedCurrentMonth],
  );

  const [activeMonthIndex, setActiveMonthIndex] = useState(initialMonthIndex);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  useEffect(() => {
    setActiveMonthIndex(initialMonthIndex);
  }, [initialMonthIndex]);

  const activeMonth = calendar[activeMonthIndex] ?? derivedCurrentMonth;
  const dates = activeMonth?.days ?? [];

  useEffect(() => {
    if (!activeMonth) {
      setSelectedDayKey(null);
      return;
    }

    const fallbackDay =
      (activeMonth.month === derivedCurrentMonth?.month ? derivedToday : null) ||
      activeMonth.days.find((item) => item.event && item.event !== '-') ||
      activeMonth.days.find((item) => item.dayOrder && item.dayOrder !== '-') ||
      activeMonth.days[0] ||
      null;

    setSelectedDayKey(fallbackDay ? getDayKey(activeMonth.month, fallbackDay.date) : null);
  }, [activeMonth, derivedCurrentMonth?.month, derivedToday]);

  const selectedDay = useMemo(() => {
    if (!activeMonth) return null;
    return (
      activeMonth.days.find((item) => getDayKey(activeMonth.month, item.date) === selectedDayKey) ||
      activeMonth.days[0] ||
      null
    );
  }, [activeMonth, selectedDayKey]);

  const monthEventItems = useMemo(() => {
    if (!activeMonth) return [];

    const withEvents = activeMonth.days
      .filter((item) => item.event && item.event !== '-' && !/^(?:day\s*)?[1-5]$/i.test(item.event))
      .sort((a, b) => Number(a.date) - Number(b.date));

    const selectedKey = selectedDay ? getDayKey(activeMonth.month, selectedDay.date) : null;
    return withEvents.sort((a, b) => {
      const aSelected = selectedKey === getDayKey(activeMonth.month, a.date);
      const bSelected = selectedKey === getDayKey(activeMonth.month, b.date);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return Number(a.date) - Number(b.date);
    });
  }, [activeMonth, selectedDay]);

  function handleSelectDay(date: string) {
    if (!activeMonth) return;
    setSelectedDayKey(getDayKey(activeMonth.month, date));
  }

  function goToPreviousMonth() {
    setActiveMonthIndex((current) => Math.max(0, current - 1));
  }

  function goToNextMonth() {
    setActiveMonthIndex((current) => Math.min(calendar.length - 1, current + 1));
  }

  const canGoPrevious = activeMonthIndex > 0;
  const canGoNext = activeMonthIndex < calendar.length - 1;

  return (
    <PageReveal className="flex flex-col gap-8 pb-40 pt-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 relative">
            <Image src={avatarUrl} alt="Profile" fill className="object-cover" unoptimized />
          </div>
          <span className="font-headline normal-case font-bold text-xl text-primary tracking-tighter">FucK Academia</span>
        </div>
        <Bell className="text-primary w-6 h-6" />
      </header>

      <section className="mt-4">
        <span className="font-label text-[10px] font-bold tracking-[0.2em] text-[#808080] uppercase">CURRENT CYCLE</span>
        <RevealHeading>
          <h1 className="font-headline mt-4 text-[7.5rem] font-bold leading-[0.8] tracking-tighter">
            <span className="text-white">day </span>
            <span className="text-primary">
              {loading || !selectedDay?.dayOrder || selectedDay.dayOrder === '--' || Number.isNaN(Number(selectedDay.dayOrder))
                ? '--'
                : <CountUp value={Number(selectedDay.dayOrder)} />}
            </span>
          </h1>
        </RevealHeading>
        <RevealText>
          <p className="font-headline text-2xl font-semibold italic text-[#808080] mt-6">
            {loading
              ? 'calendar syncing...'
              : selectedDay && activeMonth
                ? `${selectedDay.day.toLowerCase()}, ${activeMonth.month.toLowerCase()} ${selectedDay.date}`
                : activeMonth
                  ? `${formatMonthTitle(activeMonth.month).toLowerCase()} calendar loaded`
                  : 'calendar loading'}
          </p>
        </RevealText>
      </section>

      <RevealItem className="bg-[#121212] rounded-[42px] p-10 mt-2 border border-white/5 shadow-[0_4px_44px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between mb-12">
          <h2 className="font-headline text-3xl font-bold text-white tracking-tight">
            {activeMonth ? formatMonthTitle(activeMonth.month).toLowerCase() : 'calendar'}
          </h2>
          <div className="flex gap-4">
            <button
              onClick={goToPreviousMonth}
              disabled={!canGoPrevious}
              className={cn(
                'w-10 h-10 rounded-full border flex items-center justify-center bg-[#1c1c1c] transition-colors',
                canGoPrevious
                  ? 'border-white/10 text-[#808080] hover:text-white'
                  : 'border-white/5 text-[#4a4a4a] cursor-not-allowed',
              )}
              aria-label="Previous month"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={goToNextMonth}
              disabled={!canGoNext}
              className={cn(
                'w-10 h-10 rounded-full border flex items-center justify-center bg-[#1c1c1c] transition-colors',
                canGoNext
                  ? 'border-white/10 text-[#808080] hover:text-white'
                  : 'border-white/5 text-[#4a4a4a] cursor-not-allowed',
              )}
              aria-label="Next month"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {error ? <p className="text-sm text-error font-body mb-6">{error}</p> : null}
        <div className="grid grid-cols-7 gap-y-8 text-center">
          {days.map((day) => (
            <div key={day} className="font-label text-[9px] font-bold tracking-[0.2em] text-[#444] uppercase">{day}</div>
          ))}
          {(loading ? [] : dates).map((date, index) => {
            const dateKey = activeMonth ? getDayKey(activeMonth.month, date.date) : `${date.date}-${index}`;
            const isSelected = dateKey === selectedDayKey;
            const tone = getCalendarTone(date.event || '', date.day);

            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => handleSelectDay(date.date)}
                className="relative flex flex-col items-center group cursor-pointer"
              >
                <div
                  className={cn(
                    'w-11 h-11 flex items-center justify-center font-headline text-xl font-bold rounded-xl transition-all',
                    isSelected && tone === 'holiday' && 'border-2 border-[#ffb86b] bg-[#ffb86b]/12 text-[#ffb86b] shadow-[0_0_18px_rgba(255,184,107,0.3)] scale-110',
                    isSelected && tone === 'exam' && 'border-2 border-secondary bg-secondary/10 text-secondary shadow-[0_0_18px_rgba(0,224,255,0.25)] scale-110',
                    isSelected && tone === 'event' && 'border-2 border-error bg-error/10 text-error shadow-[0_0_18px_rgba(255,115,81,0.22)] scale-110',
                    isSelected && tone === 'default' && 'border-2 border-primary bg-primary/10 text-primary shadow-[0_0_20px_rgba(182,255,0,0.3)] scale-110',
                    !isSelected && tone === 'holiday' && 'text-[#ffb86b] group-hover:bg-[#ffb86b]/8',
                    !isSelected && tone === 'exam' && 'text-secondary group-hover:bg-secondary/8',
                    !isSelected && tone === 'event' && 'text-error group-hover:bg-error/8',
                    !isSelected && tone === 'default' && 'text-white group-hover:bg-white/5',
                  )}
                >
                  {date.date}
                </div>
                <div className="flex gap-0.5 mt-1 absolute -bottom-3">
                  {tone !== 'default' ? (
                    <div
                      className={cn(
                        'w-1.5 h-1.5 rounded-full shadow-sm',
                        tone === 'holiday' && 'bg-[#ffb86b]',
                        tone === 'exam' && 'bg-secondary',
                        tone === 'event' && 'bg-error',
                      )}
                    />
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </RevealItem>

      <RevealText className="flex flex-wrap gap-5 px-1 mt-4">
        <LegendItem color="bg-secondary" label="MAJOR EXAMS" />
        <LegendItem color="bg-error" label="EVENTS" />
        <LegendItem color="bg-[#ffb86b]" label="HOLIDAYS" />
        <LegendItem color="bg-[#444]" label="DAY ORDER" />
      </RevealText>

      <section className="mt-6">
        <RevealText className="inline-block border-b-2 border-primary mb-8 px-1">
          <h2 className="font-headline text-2xl font-bold lowercase text-white pb-1">daily_events</h2>
        </RevealText>

        <GlassCard className="p-8 space-y-8 bg-[#121212]/50 backdrop-blur-xl border border-white/5">
          {(monthEventItems.length
            ? monthEventItems
            : [{ date: selectedDay?.date || '--', day: selectedDay?.day || 'stay tuned', dayOrder: selectedDay?.dayOrder || '-', event: selectedDay?.event && selectedDay.event !== '-' ? selectedDay.event : 'no upcoming events' }]
          ).map((item, index) => {
            const tone = getCalendarTone(item.event || '', item.day);
            const isSelected =
              activeMonth &&
              selectedDay &&
              getDayKey(activeMonth.month, item.date) === getDayKey(activeMonth.month, selectedDay.date);

            return (
              <RevealItem key={`${item.date}-${item.event}-${index}`}>
                <AgendaItem
                  time={item.date || '--'}
                  title={(item.event || 'no upcoming events').toLowerCase()}
                  subtitle={`${(item.day || 'stay tuned').toLowerCase()} • day ${item.dayOrder || '-'}`}
                  tone={tone}
                  active={isSelected || index === 0}
                />
              </RevealItem>
            );
          })}
        </GlassCard>
      </section>
    </PageReveal>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn('w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]', color === 'bg-secondary' ? 'text-secondary' : color === 'bg-error' ? 'text-error' : color === 'bg-[#ffb86b]' ? 'text-[#ffb86b]' : 'text-[#444]', color)} />
      <span className="font-label text-[8px] font-bold tracking-widest text-[#808080] uppercase">{label}</span>
    </div>
  );
}

function AgendaItem({
  time,
  title,
  subtitle,
  tone,
  active,
}: {
  time: string;
  title: string;
  subtitle: string;
  tone: CalendarTone;
  active?: boolean;
}) {
  return (
    <div className="flex gap-8 relative group">
      <div className="w-12 pt-1 font-label text-[10px] font-bold tracking-widest text-[#808080] uppercase opacity-70">{time}</div>
      <div className="flex-1 relative pl-5">
        <div
          className={cn(
            'absolute left-0 top-1 bottom-1 w-[2px]',
            tone === 'holiday' && 'bg-[#ffb86b] shadow-[0_0_12px_rgba(255,184,107,0.7)]',
            tone === 'exam' && 'bg-secondary shadow-[0_0_12px_var(--secondary)]',
            tone === 'event' && 'bg-error shadow-[0_0_12px_var(--error)]',
            tone === 'default' && 'bg-primary shadow-[0_0_12px_var(--primary)]',
          )}
        />
        <h3
          className={cn(
            'font-headline text-[20px] font-bold leading-tight',
            tone === 'holiday' && 'text-[#ffb86b]',
            tone === 'exam' && 'text-secondary',
            tone === 'event' && 'text-error',
            tone === 'default' && (active ? 'text-primary' : 'text-white'),
          )}
        >
          {title}
        </h3>
        <p className="text-[13px] text-[#808080] mt-1.5 font-body">{subtitle}</p>
      </div>
    </div>
  );
}
