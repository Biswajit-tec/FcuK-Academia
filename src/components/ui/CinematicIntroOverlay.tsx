'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
  ENABLE_INTRO_SEQUENCE,
  getVariantIndex,
  introThemes,
  markCinematicSeen,
  shouldShowCinematic,
} from '@/lib/introConfig';
import CinematicIntro from '@/components/ui/CinematicIntro';
import { useTheme } from '@/context/ThemeContext';

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
  // Track whether the splash was ever shown so we know when it finishes
  const splashWasShownRef = useRef(false);

  useEffect(() => {
    // If the splash screen is still visible, wait.
    if (showIntro) return;

    // Small delay ensures the IntroOverlay exit animation completes before cinematic starts
    const timer = setTimeout(() => {
      if (ENABLE_INTRO_SEQUENCE && shouldShowCinematic()) {
        setShow(true);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [showIntro]);

  if (!show) return null;

  const theme = introThemes[variantIndex];

  const handleComplete = () => {
    markCinematicSeen(variantIndex);
    setShow(false);
  };

  return <CinematicIntro theme={theme} onComplete={handleComplete} />;
}

