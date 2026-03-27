'use client';

import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

import type { OnboardingThemeConfig } from '@/components/onboarding/types';

interface CTAButtonProps {
  label: string;
  onClick: () => void;
  theme: OnboardingThemeConfig;
  variant?: 'floating' | 'pill';
}

export default function CTAButton({
  label,
  onClick,
  theme,
  variant = 'floating',
}: CTAButtonProps) {
  if (variant === 'pill') {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        whileTap={{ scale: 0.98 }}
        className="relative flex h-[4.75rem] w-full items-center justify-center overflow-hidden rounded-[999px] px-8 text-[1.05rem] font-black tracking-[-0.05em]"
        style={{
          background: `linear-gradient(180deg, ${theme.accentSoft} 0%, ${theme.accent} 100%)`,
          color: theme.background,
          boxShadow: `0 18px 42px ${theme.accentGlowStrong}`,
        }}
      >
        <span className="pointer-events-none absolute inset-y-0 left-[8%] w-[32%] rounded-full bg-white/12 blur-2xl" />
        <span className="font-headline lowercase">{label}</span>
      </motion.button>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border"
      style={{
        background: `linear-gradient(180deg, ${theme.accentSoft} 0%, ${theme.accent} 100%)`,
        borderColor: theme.accentBorder,
        color: theme.background,
        boxShadow: `0 18px 38px ${theme.accentGlowStrong}`,
      }}
      aria-label={label}
    >
      <ArrowRight size={28} strokeWidth={2.2} />
    </motion.button>
  );
}
