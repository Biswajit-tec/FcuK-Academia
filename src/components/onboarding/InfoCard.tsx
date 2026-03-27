'use client';

import type { CSSProperties, ReactNode } from 'react';
import { motion } from 'framer-motion';

import type { OnboardingThemeConfig } from '@/components/onboarding/types';

interface InfoCardProps {
  children: ReactNode;
  theme: OnboardingThemeConfig;
  className?: string;
  style?: CSSProperties;
  glow?: boolean;
  tilt?: number;
  float?: boolean;
}

export default function InfoCard({
  children,
  theme,
  className,
  style,
  glow = false,
  tilt = 0,
  float = false,
}: InfoCardProps) {
  return (
    <motion.div
      className={className}
      animate={float ? { y: [0, -8, 0], rotate: [tilt, tilt + 1.6, tilt] } : { rotate: tilt }}
      transition={float ? { duration: 5.4, ease: 'easeInOut', repeat: Infinity } : undefined}
      style={{
        border: `1px solid ${theme.surfaceBorder}`,
        background: `linear-gradient(180deg, ${theme.surfaceTop} 0%, ${theme.surface} 100%)`,
        boxShadow: glow ? `0 0 0 1px ${theme.accentBorder}, 0 0 38px ${theme.accentGlow}` : theme.surfaceShadow,
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}
