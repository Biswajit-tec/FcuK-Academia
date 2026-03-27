'use client';

import React from 'react';

import { cn } from '@/lib/utils';

interface ThemedNumberTextProps {
  value: string;
  className?: string;
}

export default function ThemedNumberText({ value, className }: ThemedNumberTextProps) {
  return (
    <span className={cn('inline-flex items-baseline gap-0', className)} aria-label={value}>
      {Array.from(value).map((character, index) => (
        /\d/.test(character) ? (
          <span key={`${character}-${index}`} className="theme-number-font">
            {character}
          </span>
        ) : (
          <span key={`${character}-${index}`}>{character}</span>
        )
      ))}
    </span>
  );
}
