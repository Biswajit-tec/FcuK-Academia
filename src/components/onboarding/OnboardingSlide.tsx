'use client';

import type { CSSProperties, ReactNode } from 'react';
import { motion } from 'framer-motion';

import type { OnboardingThemeConfig } from '@/components/onboarding/types';
import { cn } from '@/lib/utils';

interface OnboardingSlideProps {
  index: number;
  isActive: boolean;
  theme: OnboardingThemeConfig;
  backgroundNumber?: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 26 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.42,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export function SlideItem({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <motion.div variants={itemVariants} className={className} style={style}>
      {children}
    </motion.div>
  );
}

export default function OnboardingSlide({
  index,
  isActive,
  theme,
  backgroundNumber,
  children,
  className,
  style,
}: OnboardingSlideProps) {
  return (
    <section
      className={cn('snap-start', className)}
      style={style}
      aria-hidden={!isActive}
      aria-label={`Onboarding slide ${index + 1}`}
    >
      {backgroundNumber ? (
        <div
          className="pointer-events-none absolute left-0 top-[4.8rem] text-[15rem] font-black leading-none tracking-[-0.12em] opacity-[0.055]"
          style={{ color: theme.text }}
        >
          {backgroundNumber}
        </div>
      ) : null}

      <motion.div
        className="relative z-[1] flex h-full flex-col"
        variants={containerVariants}
        initial={false}
        animate="visible"
      >
        {children}
      </motion.div>
    </section>
  );
}
