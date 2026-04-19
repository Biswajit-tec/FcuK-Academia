'use client';

import React, { useEffect, useMemo } from 'react';

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
 * Orchestrator layer.
 *
 * Responsibilities:
 *  - Checks NEXT_PUBLIC_ENABLE_INTRO_SEQUENCE feature flag
 *  - Checks the 24-hour localStorage gate
 *  - Selects the daily variant via UTC-day rotation
 *  - Mounts <CinematicIntro> with the correct theme
 *  - Calls dismissCinematic immediately when the intro should be skipped
 *  - Calls dismissCinematic after the cinematic finishes
 */
export default function CinematicIntroOverlay() {
  const { cinematicQueued, dismissCinematic } = useTheme();
  const variantIndex = useMemo(() => getVariantIndex(), []);

  const [active, setActive] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);

  useEffect(() => {
    setHydrated(true);
    if (ENABLE_INTRO_SEQUENCE && shouldShowCinematic()) {
      setActive(true);
    }
  }, []);

  // When the flag/gate says skip, fire dismissCinematic after first paint.
  useEffect(() => {
    // Only attempt to dismiss if we've finished hydrating and checking the 24h gate.
    if (hydrated && cinematicQueued && !active) {
      dismissCinematic();
    }
  }, [active, cinematicQueued, dismissCinematic, hydrated]);

  if (!cinematicQueued || !active) return null;

  const theme = introThemes[variantIndex];

  const handleComplete = () => {
    markCinematicSeen(variantIndex);
    dismissCinematic();
  };

  return <CinematicIntro theme={theme} onComplete={handleComplete} />;
}
