'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0 to 100
  color?: string;
  className?: string;
  showText?: boolean;
}

export default function ProgressBar({
  value,
  color = 'var(--primary)',
  className,
  showText = true,
}: ProgressBarProps) {
  return (
    <div className={cn("w-full space-y-2", className)}>
      {showText && (
        <div className="flex items-center justify-between px-1 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant sm:text-xs">
          <span>PROGRESS</span>
          <span>{value.toFixed(2)}%</span>
        </div>
      )}
      <div
        className="relative h-[14px] w-full overflow-hidden rounded-full"
        style={{
          background: 'color-mix(in srgb, var(--surface-soft) 92%, transparent)',
          border: '1px solid var(--border)',
        }}
      >
        <div
          style={{ 
            width: `${value}%`,
            backgroundColor: color,
            boxShadow: `0 0 16px ${color}`,
          }}
          className="h-full rounded-full transition-all duration-1000 ease-out"
        />
      </div>
    </div>
  );
}
