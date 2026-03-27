'use client';

import { motion } from 'framer-motion';

import type { OnboardingThemeConfig } from '@/components/onboarding/types';

interface ProgressDotsProps {
  count: number;
  activeIndex: number;
  theme: OnboardingThemeConfig;
}

export default function ProgressDots({ count, activeIndex, theme }: ProgressDotsProps) {
  return (
    <div className="flex items-center gap-4" aria-label={`Slide ${activeIndex + 1} of ${count}`}>
      {Array.from({ length: count }).map((_, index) => {
        const active = index === activeIndex;
        return (
          <motion.span
            key={index}
            animate={{
              width: active ? 14 : 7,
              height: active ? 14 : 7,
              opacity: active ? 1 : 0.28,
              backgroundColor: active ? theme.accent : theme.text,
              boxShadow: active ? `0 0 18px ${theme.accentGlow}` : 'none',
            }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="block rounded-full"
          />
        );
      })}
    </div>
  );
}
