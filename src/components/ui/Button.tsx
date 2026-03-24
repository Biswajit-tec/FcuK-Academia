'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

import { useTheme } from '@/context/ThemeContext';
import { getInteractiveMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'brutalist' | 'ghost';
  fullWidth?: boolean;
}

export default function Button({
  children,
  className,
  variant = 'primary',
  fullWidth = false,
  ...props
}: ButtonProps) {
  const { themeConfig } = useTheme();
  const motionProps = getInteractiveMotion(themeConfig.motion);
  const variants = {
    primary: "rounded-[var(--radius-pill)] bg-primary px-6 py-3 font-label font-semibold uppercase tracking-[0.22em] text-[var(--text-inverse)] shadow-[var(--glow-primary)]",
    secondary: "rounded-[var(--radius-pill)] bg-secondary px-6 py-3 font-label font-semibold uppercase tracking-[0.22em] text-[var(--text-inverse)] shadow-[var(--glow-secondary)]",
    brutalist: "flex items-center justify-center gap-4 rounded-[var(--radius-md)] border-2 border-error bg-[var(--surface-soft)] p-6 font-headline text-2xl font-bold lowercase tracking-tight text-error shadow-[4px_4px_0_0_var(--error)]",
    ghost: "font-label font-semibold uppercase tracking-[0.2em] text-primary",
  };

  return (
    <motion.button
      whileTap={motionProps.whileTap}
      whileHover={motionProps.whileHover}
      transition={motionProps.transition}
      className={cn(
        "inline-flex items-center justify-center transition-transform",
        variants[variant],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
