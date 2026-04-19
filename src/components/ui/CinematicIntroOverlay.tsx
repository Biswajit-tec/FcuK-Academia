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
    if (showIntro) {
      // Splash is currently visible — remember that it ran
      splashWasShownRef.current = true;
      return;
    }

    // showIntro just turned false. Only trigger cinematic at this moment
    // (either right after splash finishes, or immediately if there was no splash).
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

  return <CinematicIntro theme={theme} onComplete={handleComplete} />;
}

