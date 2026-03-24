import { Transition, Variants } from 'framer-motion';

import { ThemeMotionPreset } from '@/lib/types';

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const motionPresets = {
  darkSmooth: {
    id: 'dark-smooth',
    page: {
      distance: 28,
      scale: 0.985,
      blur: 10,
      fadeDuration: 0.26,
      spring: { stiffness: 360, damping: 34, mass: 0.84 },
    },
    swipe: {
      threshold: 72,
      velocityThreshold: 0.34,
      distance: 34,
      scale: 0.985,
      spring: { stiffness: 360, damping: 34, mass: 0.84 },
      fadeDuration: 0.24,
    },
    reveal: {
      y: 18,
      blur: 10,
      scale: 0.986,
      stagger: 0.055,
      delay: 0.03,
      duration: 0.32,
      ease: easeOut,
    },
    micro: {
      tapScale: 0.975,
      hoverScale: 1.012,
      hoverY: -1,
      duration: 0.22,
    },
    intro: {
      logoScale: 1.03,
      glowScale: 1.08,
      duration: 0.9,
      delay: 0.12,
    },
  },
  neonBrutalist: {
    id: 'neon-brutalist',
    page: {
      distance: 34,
      scale: 0.972,
      blur: 4,
      fadeDuration: 0.2,
      spring: { stiffness: 480, damping: 36, mass: 0.72 },
    },
    swipe: {
      threshold: 68,
      velocityThreshold: 0.3,
      distance: 40,
      scale: 0.972,
      spring: { stiffness: 520, damping: 38, mass: 0.72 },
      fadeDuration: 0.2,
    },
    reveal: {
      y: 22,
      blur: 6,
      scale: 0.972,
      stagger: 0.04,
      delay: 0.02,
      duration: 0.22,
      ease: easeOut,
    },
    micro: {
      tapScale: 0.95,
      hoverScale: 1.03,
      hoverY: -1,
      duration: 0.16,
    },
    intro: {
      logoScale: 1.08,
      glowScale: 1.14,
      duration: 0.78,
      delay: 0.08,
    },
  },
  lightMinimal: {
    id: 'light-minimal',
    page: {
      distance: 20,
      scale: 0.994,
      blur: 0,
      fadeDuration: 0.28,
      spring: { stiffness: 300, damping: 30, mass: 0.9 },
    },
    swipe: {
      threshold: 72,
      velocityThreshold: 0.34,
      distance: 24,
      scale: 0.994,
      spring: { stiffness: 300, damping: 30, mass: 0.9 },
      fadeDuration: 0.24,
    },
    reveal: {
      y: 14,
      blur: 0,
      scale: 0.998,
      stagger: 0.05,
      delay: 0.03,
      duration: 0.28,
      ease: easeOut,
    },
    micro: {
      tapScale: 0.98,
      hoverScale: 1.008,
      hoverY: -1,
      duration: 0.22,
    },
    intro: {
      logoScale: 1.02,
      glowScale: 1.04,
      duration: 0.72,
      delay: 0.08,
    },
  },
  claySoft: {
    id: 'clay-soft',
    page: {
      distance: 18,
      scale: 0.988,
      blur: 2,
      fadeDuration: 0.32,
      spring: { stiffness: 260, damping: 28, mass: 0.94 },
    },
    swipe: {
      threshold: 70,
      velocityThreshold: 0.32,
      distance: 20,
      scale: 0.988,
      spring: { stiffness: 260, damping: 28, mass: 0.94 },
      fadeDuration: 0.28,
    },
    reveal: {
      y: 16,
      blur: 3,
      scale: 0.992,
      stagger: 0.058,
      delay: 0.04,
      duration: 0.34,
      ease: easeOut,
    },
    micro: {
      tapScale: 0.982,
      hoverScale: 1.01,
      hoverY: -1,
      duration: 0.22,
    },
    intro: {
      logoScale: 1.03,
      glowScale: 1.05,
      duration: 0.84,
      delay: 0.1,
    },
  },
  elegantFloat: {
    id: 'elegant-float',
    page: {
      distance: 22,
      scale: 0.992,
      blur: 4,
      fadeDuration: 0.34,
      spring: { stiffness: 270, damping: 30, mass: 0.96 },
    },
    swipe: {
      threshold: 70,
      velocityThreshold: 0.32,
      distance: 24,
      scale: 0.992,
      spring: { stiffness: 270, damping: 30, mass: 0.96 },
      fadeDuration: 0.3,
    },
    reveal: {
      y: 18,
      blur: 6,
      scale: 0.994,
      stagger: 0.066,
      delay: 0.05,
      duration: 0.38,
      ease: easeOut,
    },
    micro: {
      tapScale: 0.984,
      hoverScale: 1.014,
      hoverY: -2,
      duration: 0.24,
    },
    intro: {
      logoScale: 1.04,
      glowScale: 1.08,
      duration: 0.92,
      delay: 0.14,
    },
  },
} satisfies Record<string, ThemeMotionPreset>;

function createFadeTransition(duration: number): Transition {
  return {
    duration,
    ease: easeOut,
  };
}

export function getPageMotion(motion: ThemeMotionPreset, direction: number) {
  const initialDistance = direction === 0 ? 0 : motion.page.distance * direction;
  const exitDistance = direction === 0 ? 0 : motion.page.distance * -direction;
  const springTransition = {
    type: 'spring' as const,
    ...motion.page.spring,
  };

  return {
    initial: {
      opacity: 0,
      x: initialDistance,
      scale: motion.page.scale,
      filter: motion.page.blur ? `blur(${motion.page.blur}px)` : 'blur(0px)',
    },
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
      filter: 'blur(0px)',
    },
    exit: {
      opacity: 0,
      x: exitDistance,
      scale: motion.swipe.scale,
      filter: motion.page.blur ? `blur(${Math.max(2, motion.page.blur * 0.6)}px)` : 'blur(0px)',
    },
    transition: {
      x: springTransition,
      scale: createFadeTransition(motion.page.fadeDuration),
      opacity: createFadeTransition(motion.page.fadeDuration),
      filter: createFadeTransition(motion.page.fadeDuration),
    },
  };
}

export function getRevealContainerVariants(motion: ThemeMotionPreset): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: motion.reveal.stagger,
        delayChildren: motion.reveal.delay,
      },
    },
  };
}

export function getRevealVariants(motion: ThemeMotionPreset) {
  const baseHidden = {
    opacity: 0,
    y: motion.reveal.y,
    scale: motion.reveal.scale,
    filter: motion.reveal.blur ? `blur(${motion.reveal.blur}px)` : 'blur(0px)',
  };
  const baseVisible = {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: motion.reveal.duration,
      ease: motion.reveal.ease,
    },
  };

  return {
    heading: {
      hidden: baseHidden,
      visible: baseVisible,
    },
    text: {
      hidden: {
        opacity: 0,
        y: Math.max(10, motion.reveal.y - 4),
      },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: Math.max(0.2, motion.reveal.duration - 0.04),
          ease: motion.reveal.ease,
        },
      },
    },
    item: {
      hidden: baseHidden,
      visible: baseVisible,
    },
  };
}

export function getInteractiveMotion(motion: ThemeMotionPreset) {
  return {
    whileHover: {
      scale: motion.micro.hoverScale,
      y: motion.micro.hoverY,
    },
    whileTap: {
      scale: motion.micro.tapScale,
      y: 0,
    },
    transition: {
      duration: motion.micro.duration,
      ease: easeOut,
    } satisfies Transition,
  };
}
