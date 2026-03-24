'use client';

import React, { useMemo, useState } from 'react';
import { Bell } from 'lucide-react';
import Image from 'next/image';

import GlowCard from '@/components/ui/GlowCard';
import { PageReveal, RevealItem, RevealText } from '@/components/ui/PageReveal';
import { useTimetable } from '@/hooks/useTimetable';
import { useUser } from '@/hooks/useUser';
import { createAvatarUrl, getClassesForDay, getDayOrders } from '@/lib/academia-ui';
import { cn } from '@/lib/utils';

export default function TimetablePage() {
  const { timetableRaw, loading, error } = useTimetable();
  const { user } = useUser();
  const dayOrders = useMemo(() => getDayOrders(timetableRaw), [timetableRaw]);
  const [selectedDayOrder, setSelectedDayOrder] = useState(1);
  const dayOrder = dayOrders.includes(selectedDayOrder) ? selectedDayOrder : (dayOrders[0] || 1);
  const classes = getClassesForDay(timetableRaw, dayOrder);
  const avatarUrl = createAvatarUrl(user?.name || 'SRM Student');

  return (
    <PageReveal className="flex flex-col gap-8 pb-32 pt-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-full border border-[color:var(--border)]">
            <Image src={avatarUrl} alt="Profile" fill className="object-cover" unoptimized />
          </div>
          <span className="font-headline text-xl font-bold normal-case tracking-tight text-primary">FucK Academia</span>
        </div>
        <Bell className="h-6 w-6 text-primary" />
      </header>

      <RevealText className="relative z-10 mt-4 flex items-center gap-5">
        <span className="theme-kicker">day order</span>
        <div className="flex gap-3">
          {(dayOrders.length ? dayOrders : [1, 2, 3, 4]).map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setSelectedDayOrder(num)}
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-full border font-headline text-xl font-bold transition-all',
                dayOrder === num ? 'text-[var(--text-inverse)] shadow-[var(--glow-primary)]' : 'text-on-surface-variant',
              )}
              style={
                dayOrder === num
                  ? { backgroundColor: 'var(--primary)', borderColor: 'var(--primary)' }
                  : { background: 'color-mix(in srgb, var(--surface-soft) 92%, transparent)', borderColor: 'var(--border)' }
              }
            >
              {num}
            </button>
          ))}
        </div>
      </RevealText>

      {error ? <p className="text-sm text-error font-body">{error}</p> : null}
      <section className="relative mt-2">
        <div
          className="absolute bottom-0 left-3 top-4 z-0 w-px"
          style={{ background: 'linear-gradient(180deg, color-mix(in srgb, var(--border-strong) 80%, transparent), transparent)' }}
        />

        <div className="relative z-10 flex flex-col gap-8">
          {loading ? (
            [1, 2, 3].map((item) => <div key={item} className="ml-8 h-36 rounded-[28px] bg-surface animate-pulse" />)
          ) : classes.length ? (
            classes.map((item, index) => {
              const isPrimary = index === 2;
              const glow = index % 2 === 0 ? 'primary' : 'secondary';

              return (
                <RevealItem key={`${item.slot}-${item.time}-${index}`} className="relative flex gap-6">
                  <div className="relative mt-6">
                    <div
                      className={cn('relative z-10 h-2.5 w-2.5 rounded-full', glow === 'primary' ? 'bg-primary' : 'bg-secondary')}
                      style={{ boxShadow: glow === 'primary' ? 'var(--glow-primary)' : 'var(--glow-secondary)' }}
                    />
                  </div>
                  {isPrimary ? (
                    <div
                      className="flex-1 rounded-[var(--radius-lg)] p-7 md:p-8"
                      style={{
                        background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 88%, white 12%), color-mix(in srgb, var(--secondary) 14%, var(--primary) 86%))',
                        boxShadow: 'var(--elevation-card)',
                      }}
                    >
                      <div
                        className="mb-2 inline-block rounded px-2 py-0.5 font-headline text-[14px] font-bold tracking-widest"
                        style={{ background: 'rgba(0,0,0,0.08)', color: 'var(--text-inverse)' }}
                      >
                        {item.time}
                      </div>
                      <h3 className="mb-6 font-headline text-[28px] font-bold lowercase leading-[1.1] text-[var(--text-inverse)]">
                        {item.courseTitle?.toLowerCase()}
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <InfoColumn label="room" value={item.courseRoomNo || 'TBA'} inverse />
                        <InfoColumn label="faculty" value={item.faculty || 'Faculty TBA'} inverse />
                      </div>
                    </div>
                  ) : (
                    <GlowCard glowColor={glow} className="flex-1 border-l-2 bg-transparent">
                      <div className="mb-2 font-headline text-[14px] font-bold tracking-widest text-secondary">{item.time}</div>
                      <h3 className="mb-6 pr-4 font-headline text-[26px] font-bold lowercase leading-[1.1] text-on-surface">
                        {item.courseTitle?.toLowerCase()}
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <InfoColumn label="room" value={item.courseRoomNo || 'TBA'} />
                        <InfoColumn label="faculty" value={item.faculty || 'Faculty TBA'} />
                      </div>
                    </GlowCard>
                  )}
                </RevealItem>
              );
            })
          ) : (
            <RevealItem className="theme-card ml-8 p-8 text-on-surface-variant">No classes found for this day order.</RevealItem>
          )}
        </div>
      </section>
    </PageReveal>
  );
}

function InfoColumn({
  label,
  value,
  inverse,
}: {
  label: string;
  value: string;
  inverse?: boolean;
}) {
  return (
    <div>
      <span className={cn('mb-1 block font-label text-[9px] font-bold uppercase tracking-[0.2em]', inverse ? 'text-[rgba(0,0,0,0.55)]' : 'text-on-surface-variant')}>
        {label}
      </span>
      <span className={cn('block font-headline text-lg font-bold leading-tight', inverse ? 'text-[var(--text-inverse)]' : 'text-on-surface')}>
        {value}
      </span>
    </div>
  );
}
