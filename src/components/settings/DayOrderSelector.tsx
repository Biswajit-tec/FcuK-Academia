'use client';

import React, { useState } from 'react';

import GlassCard from '../ui/GlassCard';
import { cn } from '@/lib/utils';

const days = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6'];

export default function DayOrderSelector() {
  const [selected, setSelected] = useState('Day 1');

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="theme-kicker">preferences</p>
        <h3 className="font-headline text-2xl font-bold text-on-surface">active day order</h3>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {days.map((day) => (
          <GlassCard
            key={day}
            onClick={() => setSelected(day)}
            className={cn(
              "cursor-pointer p-4 text-center transition-all",
              selected === day ? "shadow-[var(--glow-primary)]" : ""
            )}
            style={selected === day ? {
              borderColor: 'var(--border-strong)',
              background: 'color-mix(in srgb, var(--primary) 14%, transparent)',
            } : { borderColor: 'var(--border)' }}
          >
            <span className={cn(
               "font-headline text-lg",
               selected === day ? "text-primary" : "text-on-surface-variant"
            )}>{day}</span>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
