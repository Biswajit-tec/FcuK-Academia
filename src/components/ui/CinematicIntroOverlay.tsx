'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
  ENABLE_INTRO_SEQUENCE,
  getVariantIndex,
  introThemes,
  markCinematicSeen,
  shouldShowCinematic,
} from '@/lib/introConfig';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import CinematicIntro from '@/components/ui/CinematicIntro';

/**
 * Self-activating cinematic intro overlay.
 *
 * Waits for the Lottie splash screen (IntroOverlay) to finish first,
 * then plays the cinematic. Theme is randomised per session so every
 * user sees a different colour each time they reopen the app.
 */
export default function CinematicIntroOverlay() {
  const { showIntro } = useTheme();
  const variantIndex = useMemo(() => getVariantIndex(), []);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // If the splash screen is still visible, don't show cinematic yet.
    if (showIntro) return;

    // Trigger immediately when showIntro turns false.
    // This allows the Cinematic background to start showing while the Logo slides up.
    if (ENABLE_INTRO_SEQUENCE && shouldShowCinematic()) {
      setShow(true);
    }
  }, [showIntro]);

  if (!show) return null;

  const theme = introThemes[variantIndex];

  const handleComplete = () => {
    markCinematicSeen(variantIndex);
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="cinematic-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="fixed inset-0 z-[155]"
        >
          <CinematicIntro theme={theme} onComplete={handleComplete} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

