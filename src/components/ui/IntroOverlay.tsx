'use client';

import { AnimatePresence, motion } from 'framer-motion';

import { useTheme } from '@/context/ThemeContext';

export default function IntroOverlay() {
  const { showIntro, dismissIntro, themeConfig } = useTheme();
  const motionPreset = themeConfig.motion;

  return (
    <AnimatePresence>
      {showIntro ? (
        <motion.div
          key="intro"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } }}
          className="fixed inset-0 z-[120] flex items-center justify-center px-8"
          style={{
            background: 'color-mix(in srgb, var(--background) 92%, transparent)',
            backdropFilter: 'blur(18px)',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96, filter: 'blur(14px)' }}
            animate={{
              opacity: 1,
              y: 0,
              scale: motionPreset.intro.logoScale,
              filter: 'blur(0px)',
            }}
            transition={{
              duration: motionPreset.intro.duration,
              delay: motionPreset.intro.delay,
              ease: [0.22, 1, 0.36, 1],
            }}
            onAnimationComplete={dismissIntro}
            className="theme-card flex w-full max-w-xs flex-col items-center gap-5 px-8 py-10 text-center"
          >
            <motion.div
              animate={{
                scale: [1, motionPreset.intro.glowScale, 1],
                opacity: [0.7, 1, 0.72],
              }}
              transition={{ duration: motionPreset.intro.duration * 1.1, ease: 'easeInOut' }}
              className="h-20 w-20 rounded-[28px]"
              style={{
                background: 'var(--hero-gradient)',
                boxShadow: 'var(--glow-primary), var(--elevation-card)',
              }}
            />
            <div className="space-y-2">
              <p className="theme-kicker">first launch</p>
              <h1 className="font-headline text-3xl font-bold text-on-surface">FucK Academia</h1>
              <p className="text-sm text-on-surface-variant">
                loading your visual core
              </p>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
