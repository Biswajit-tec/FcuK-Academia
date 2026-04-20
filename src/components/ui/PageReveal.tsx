'use client';

import React, { PropsWithChildren, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

import { useTheme } from '@/context/ThemeContext';
import { getRevealContainerVariants, getRevealVariants } from '@/lib/motion';


function useMountedAnimation() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMounted(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  return mounted;
}

export function PageReveal({ children, className }: PropsWithChildren<{ className?: string }>) {
  const mounted = useMountedAnimation();
  const { themeConfig } = useTheme();
  const containerVariants = getRevealContainerVariants(themeConfig.motion);

  if (!mounted) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function RevealHeading({ children, className }: PropsWithChildren<{ className?: string }>) {
  const mounted = useMountedAnimation();
  const { themeConfig, isDark } = useTheme();
  const variants = getRevealVariants(themeConfig.motion);

  if (!mounted) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={variants.heading}
      className={className}
      style={{ textShadow: isDark ? 'var(--glow-primary)' : 'none' }}
    >
      {children}
    </motion.div>
  );
}

export function RevealText({ children, className }: PropsWithChildren<{ className?: string }>) {
  const mounted = useMountedAnimation();
  const { themeConfig } = useTheme();
  const variants = getRevealVariants(themeConfig.motion);

  if (!mounted) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div variants={variants.text} className={className}>
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className }: PropsWithChildren<{ className?: string }>) {
  const mounted = useMountedAnimation();
  const { themeConfig } = useTheme();
  const variants = getRevealVariants(themeConfig.motion);

  if (!mounted) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div variants={variants.item} className={className}>
      {children}
    </motion.div>
  );
}
