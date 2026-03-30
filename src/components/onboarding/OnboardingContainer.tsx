'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Database,
  HardDriveDownload,
  LockKeyhole,
  Shield,
  Sparkles,
  WifiOff,
  Zap,
} from 'lucide-react';

import CTAButton from '@/components/onboarding/CTAButton';
import InfoCard from '@/components/onboarding/InfoCard';
import OnboardingSlide, { SlideItem } from '@/components/onboarding/OnboardingSlide';
import ProgressDots from '@/components/onboarding/ProgressDots';
import UserAvatar from '@/components/ui/UserAvatar';
import type { OnboardingThemeConfig } from '@/components/onboarding/types';
import { trackEvent } from '@/lib/analytics';

interface OnboardingContainerProps {
  theme: OnboardingThemeConfig;
  onFinish: () => void;
}

interface BottomNavProps {
  activeIndex: number;
  totalSlides: number;
  theme: OnboardingThemeConfig;
  onNext: () => void;
}

const DIRECTION_LOCK_RATIO = 1.1;
const NAV_TRANSITION_DURATION_MS = 250;
const ONBOARDING_SCREEN_NAMES = [
  'onboarding_1',
  'onboarding_2',
  'onboarding_3',
  'onboarding_4',
  'onboarding_5',
] as const;

function progressTransition(delay = 0) {
  return {
    duration: 0.95,
    delay,
    ease: [0.22, 1, 0.36, 1] as const,
  };
}

function ProgressFill({
  active,
  width,
  theme,
  delay = 0,
}: {
  active: boolean;
  width: string;
  theme: OnboardingThemeConfig;
  delay?: number;
}) {
  return (
    <div className="h-[0.38rem] w-full overflow-hidden rounded-full" style={{ background: theme.surfaceMuted }}>
      <motion.div
        className="h-full rounded-full"
        animate={{ width: active ? width : '0%' }}
        transition={progressTransition(delay)}
        style={{
          background: `linear-gradient(90deg, ${theme.accentSoft} 0%, ${theme.accent} 100%)`,
          boxShadow: `0 0 20px ${theme.accentGlow}`,
        }}
      />
    </div>
  );
}

function MiniBar({
  active,
  width,
  color,
}: {
  active: boolean;
  width: string;
  color: string;
}) {
  return (
    <div className="h-[0.18rem] flex-1 overflow-hidden rounded-full bg-white/8">
      <motion.div
        className="h-full rounded-full"
        animate={{ width: active ? width : '0%' }}
        transition={progressTransition(0.1)}
        style={{ background: color }}
      />
    </div>
  );
}

function BottomNav({ activeIndex, totalSlides, theme, onNext }: BottomNavProps) {
  return (
    <div
      className="absolute inset-x-4 z-30 flex items-center justify-between sm:inset-x-5"
      style={{ bottom: 'max(1.1rem, calc(env(safe-area-inset-bottom) + 0.7rem))' }}
    >
      <div className="h-[4rem] w-[4rem] shrink-0 opacity-0 max-[360px]:h-[3.7rem] max-[360px]:w-[3.7rem]" aria-hidden="true" />
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2">
        <ProgressDots count={totalSlides} activeIndex={activeIndex} theme={theme} />
      </div>
      <CTAButton label="next slide" onClick={onNext} theme={theme} />
    </div>
  );
}

export default function OnboardingContainer({ theme, onFinish }: OnboardingContainerProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  const navTimerRef = useRef<number | null>(null);
  const programmaticScrollBehaviorRef = useRef<ScrollBehavior>('auto');
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const gestureLockRef = useRef<'x' | 'y' | null>(null);
  const activeIndexRef = useRef(0);
  const stepNavigationSourceRef = useRef<'initial' | 'button' | 'swipe'>('initial');
  const previousTrackedIndexRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [viewportNode, setViewportNode] = useState<HTMLDivElement | null>(null);

  const totalSlides = 5;
  const compact = viewportHeight > 0 && viewportHeight < 780;
  const extraCompact = viewportHeight > 0 && viewportHeight < 700;
  const nonFinalBottomPadding = extraCompact
    ? 'pb-[max(7.35rem,calc(env(safe-area-inset-bottom)+6.25rem))]'
    : 'pb-[max(8.35rem,calc(env(safe-area-inset-bottom)+7rem))]';
  const finalBottomPadding = extraCompact
    ? 'pb-[max(1rem,env(safe-area-inset-bottom))]'
    : 'pb-[max(1.5rem,env(safe-area-inset-bottom))]';

  const toggleSwipeMode = useCallback((active: boolean) => {
    document.body.classList.toggle('is-swiping', active);
  }, []);

  const toggleNavigationMode = useCallback((active: boolean) => {
    document.body.classList.toggle('is-navigating', active);
  }, []);

  const clearNavigationMode = useCallback(() => {
    if (navTimerRef.current !== null) {
      window.clearTimeout(navTimerRef.current);
      navTimerRef.current = null;
    }

    toggleNavigationMode(false);
  }, [toggleNavigationMode]);

  const scheduleNavigationModeReset = useCallback(() => {
    if (navTimerRef.current !== null) {
      window.clearTimeout(navTimerRef.current);
    }

    navTimerRef.current = window.setTimeout(() => {
      navTimerRef.current = null;
      toggleNavigationMode(false);
    }, NAV_TRANSITION_DURATION_MS);
  }, [toggleNavigationMode]);

  useEffect(() => {
    return () => {
      if (settleTimerRef.current !== null) {
        window.clearTimeout(settleTimerRef.current);
      }
      if (navTimerRef.current !== null) {
        window.clearTimeout(navTimerRef.current);
      }
      toggleSwipeMode(false);
      toggleNavigationMode(false);
    };
  }, [toggleNavigationMode, toggleSwipeMode]);

  useEffect(() => {
    const node = viewportNode;
    if (!node) return;

    viewportRef.current = node;

    const updateSize = () => {
      const nextWidth = node.clientWidth;
      const nextHeight = node.clientHeight;
      setViewportWidth((current) => (current === nextWidth ? current : nextWidth));
      setViewportHeight((current) => (current === nextHeight ? current : nextHeight));
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);

    return () => observer.disconnect();
  }, [viewportNode]);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node || !viewportWidth) return;

    const targetLeft = activeIndex * viewportWidth;
    if (Math.abs(node.scrollLeft - targetLeft) < 1) return;

    node.scrollTo({
      left: targetLeft,
      behavior: programmaticScrollBehaviorRef.current,
    });
    programmaticScrollBehaviorRef.current = 'auto';

    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
    }

    settleTimerRef.current = window.setTimeout(() => {
      toggleSwipeMode(false);
      clearNavigationMode();
      settleTimerRef.current = null;
    }, 120);

    return () => {
      if (settleTimerRef.current !== null) {
        window.clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
      }
    };
  }, [activeIndex, clearNavigationMode, toggleSwipeMode, viewportWidth]);

  const goToSlide = (index: number, behavior: ScrollBehavior = 'smooth') => {
    stepNavigationSourceRef.current = 'button';
    programmaticScrollBehaviorRef.current = behavior;
    setActiveIndex(Math.max(0, Math.min(totalSlides - 1, index)));
  };

  const goNext = () => {
    if (activeIndex === totalSlides - 1) {
      onFinish();
      return;
    }

    toggleNavigationMode(true);
    scheduleNavigationModeReset();
    goToSlide(activeIndex + 1, 'smooth');
  };

  const topPadding = compact ? 'pt-[max(1.4rem,env(safe-area-inset-top))]' : 'pt-[max(2rem,env(safe-area-inset-top))]';
  const slidePadding = `px-5 ${topPadding} ${nonFinalBottomPadding}`;
  const finalSlidePadding = `px-5 ${topPadding} ${finalBottomPadding}`;
  const headingSize = compact ? 'text-[clamp(2.85rem,13.2vw,4rem)]' : 'text-[clamp(3.25rem,15.4vw,4.45rem)]';
  const subheadingSize = compact ? 'text-[clamp(2.45rem,11.4vw,3.45rem)]' : 'text-[clamp(2.9rem,13.4vw,3.95rem)]';
  const bodyTextClass = compact ? 'text-[0.96rem]' : 'text-[1.04rem]';
  const cardRadius = extraCompact ? 'rounded-[1.7rem]' : 'rounded-[2rem]';
  const slideBaseClass = 'swipe-screen relative h-full min-w-full flex-[0_0_100%] shrink-0';

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    const screenName = ONBOARDING_SCREEN_NAMES[activeIndex] ?? `onboarding_${activeIndex + 1}`;
    const previousIndex = previousTrackedIndexRef.current;

    trackEvent('onboarding_step_viewed', {
      step_name: screenName,
      step_number: activeIndex + 1,
      total_steps: totalSlides,
      navigation_source: stepNavigationSourceRef.current,
    });

    if (previousIndex !== null && stepNavigationSourceRef.current === 'swipe' && previousIndex !== activeIndex) {
      trackEvent('screen_swipe', {
        from: ONBOARDING_SCREEN_NAMES[previousIndex] ?? `onboarding_${previousIndex + 1}`,
        to: screenName,
        navigation_surface: 'onboarding',
      });
    }

    previousTrackedIndexRef.current = activeIndex;
    stepNavigationSourceRef.current = 'initial';
  }, [activeIndex, totalSlides]);

  const slides = [
      <OnboardingSlide
        key="intro"
        index={0}
        isActive={activeIndex === 0}
        theme={theme}
        backgroundNumber="01"
        className={`${slideBaseClass} ${slidePadding}`}
        style={{ width: viewportWidth || undefined }}
      >
        <div className="flex h-full min-h-0 flex-col">
          <SlideItem className={compact ? 'mt-9' : 'mt-12'}>
            <h1 className={`font-headline font-bold leading-[0.83] tracking-[-0.09em] ${headingSize}`} style={{ color: theme.accent }}>
              hiiii <span className="inline-block text-[0.88em] align-[0.02em]">👋</span>
            </h1>
          </SlideItem>

          <SlideItem className={`mt-4 max-w-[18.5rem] text-[1.1rem] font-semibold leading-[1.42] tracking-[-0.04em]`} style={{ color: theme.textMuted }}>
            <p>we removed the pain from academia.</p>
            <p>what’s left is just… results.</p>
          </SlideItem>

          <div className={`relative min-h-0 flex-1 ${compact ? 'mt-6' : 'mt-8'}`}>
            <InfoCard
              theme={theme}
              glow
              float
              tilt={-1.5}
              className="absolute right-[0.15rem] top-4 w-[8rem] rounded-[0.15rem] px-4 py-4"
              style={{ background: 'rgba(40, 40, 40, 0.88)' }}
            >
              <div className="text-right font-headline text-[1.25rem] font-black tracking-[-0.08em]" style={{ color: theme.orange }}>
                LVL
              </div>
              <div className="mt-3 h-[0.2rem] rounded-full bg-white/8">
                <div className="h-full w-[62%] rounded-full" style={{ background: '#ff7e63' }} />
              </div>
            </InfoCard>

            <InfoCard
              theme={theme}
              glow
              float
              tilt={-1}
              className={`absolute left-0 top-10 w-[min(100%,17.2rem)] ${extraCompact ? 'rounded-[2rem]' : 'rounded-[2.25rem]'} px-5 py-5`}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: theme.accent, color: theme.background }}>
                  <Sparkles size={18} strokeWidth={2.2} />
                </div>
                <div>
                  <div className="font-headline text-[1.1rem] font-bold tracking-[-0.05em]" style={{ color: theme.text }}>
                    the vibe check
                  </div>
                  <div className="mt-0.5 text-[0.68rem] font-black uppercase tracking-[0.18em]" style={{ color: theme.accent }}>
                    optimized
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <ProgressFill active={activeIndex === 0} width="72%" theme={theme} delay={0.15} />
              </div>

              <p className="mt-4 max-w-[13rem] text-[0.8rem] font-semibold leading-[1.15] tracking-[-0.03em]" style={{ color: theme.textMuted }}>
                assignments decoded. brain fog cleared. aesthetics peaked.
              </p>
            </InfoCard>

            <InfoCard
              theme={theme}
              float
              tilt={-5}
              className="absolute bottom-14 left-2 w-[10.6rem] rounded-[1.7rem] px-4 py-4"
              style={{ background: 'rgba(22, 24, 24, 0.92)' }}
            >
              <div className="flex items-center gap-2 text-[0.64rem] font-black uppercase tracking-[0.16em]" style={{ color: theme.textSubtle }}>
                <BadgeCheck size={13} strokeWidth={2.2} style={{ color: theme.cyan }} />
                portal damage
              </div>
              <div className="mt-3 font-headline text-[2rem] font-black leading-none tracking-[-0.08em]" style={{ color: '#ffffff' }}>
                -87%
              </div>
              <div className="mt-2 text-[0.75rem] font-semibold leading-[1.2]" style={{ color: theme.textMuted }}>
                fewer rage taps. way cleaner runs.
              </div>
            </InfoCard>

            <InfoCard
              theme={theme}
              glow
              float
              tilt={5}
              className="absolute bottom-3 right-4 w-[9.3rem] rounded-[1.5rem] px-4 py-4"
              style={{ background: 'rgba(18, 19, 19, 0.9)' }}
            >
              <div className="flex items-center gap-2 text-[0.62rem] font-black uppercase tracking-[0.16em]" style={{ color: theme.accent }}>
                <Zap size={12} strokeWidth={2.4} />
                live mood
              </div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <div className="font-headline text-[1.5rem] font-black leading-none tracking-[-0.07em]" style={{ color: '#ffffff' }}>
                    locked
                  </div>
                  <div className="mt-1 text-[0.7rem] font-semibold" style={{ color: theme.textMuted }}>
                    zero chaos
                  </div>
                </div>
                <div className="flex items-end gap-1.5">
                  <div className="h-4 w-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.16)' }} />
                  <div className="h-7 w-1.5 rounded-full" style={{ background: theme.cyan }} />
                  <div className="h-10 w-1.5 rounded-full" style={{ background: theme.accent }} />
                </div>
              </div>
            </InfoCard>
          </div>

          <div className="pt-4">
            <div className="flex items-center justify-center gap-2">
              <p className="text-center text-[0.9rem] font-black lowercase tracking-[0.01em]" style={{ color: theme.accent }}>
                swipe to see the magic
              </p>
              <ArrowRight size={15} strokeWidth={2.2} style={{ color: theme.accent }} />
            </div>
          </div>
        </div>
      </OnboardingSlide>,
      <OnboardingSlide
        key="fast"
        index={1}
        isActive={activeIndex === 1}
        theme={theme}
        backgroundNumber="02"
        className={`${slideBaseClass} ${slidePadding}`}
        style={{ width: viewportWidth || undefined }}
      >
        <div className="flex h-full min-h-0 flex-col">
          <SlideItem className={compact ? 'mt-8' : 'mt-10'}>
            <h2 className={`font-headline font-bold leading-[0.88] tracking-[-0.08em] text-white ${headingSize}`}>
              fast af <span className="inline-block align-[0.02em] text-[0.85em]" style={{ color: theme.accent }}>⚡</span>
            </h2>
          </SlideItem>

          <SlideItem className={`mt-4 max-w-[18rem] ${bodyTextClass} font-semibold leading-[1.4] tracking-[-0.04em]`} style={{ color: theme.textMuted }}>
            <p>marks, attendance, everything</p>
            <p>loads before you even think</p>
            <p>about it.</p>
          </SlideItem>

          <SlideItem className={compact ? 'mt-7' : 'mt-9'}>
            <InfoCard theme={theme} float className={`${cardRadius} px-5 py-5`}>
              <div className="text-[0.86rem] font-black uppercase tracking-[0.16em]" style={{ color: theme.textSubtle }}>
                system latency
              </div>
              <div className="mt-2 text-right font-headline text-[2.15rem] font-black tracking-[-0.08em]" style={{ color: theme.accent }}>
                0.02ms
              </div>
              <div className="mt-4">
                <ProgressFill active={activeIndex === 1} width="82%" theme={theme} delay={0.12} />
              </div>
              <div className="mt-4 flex gap-2">
                <MiniBar active={activeIndex === 1} width="92%" color={theme.accent} />
                <MiniBar active={activeIndex === 1} width="76%" color="#95d95c" />
                <MiniBar active={activeIndex === 1} width="48%" color="#698b4d" />
                <MiniBar active={activeIndex === 1} width="24%" color="#455a39" />
              </div>
            </InfoCard>
          </SlideItem>

          <div className={`relative min-h-0 flex-1 ${compact ? 'mt-5' : 'mt-7'}`}>
            <InfoCard
              theme={theme}
              float
              tilt={-8}
              className="absolute left-0 bottom-0 w-[10.8rem] rounded-[1.8rem] px-5 py-5"
              style={{ background: 'rgba(26, 27, 27, 0.92)' }}
            >
              <div className="flex items-center gap-2 text-[0.82rem] font-black tracking-[-0.03em]" style={{ color: '#92b26f' }}>
                <BadgeCheck size={15} strokeWidth={2.2} />
                GPA: 3.9+
              </div>
              <div className="mt-8 space-y-2">
                <div className="h-[0.32rem] w-[84%] rounded-full" style={{ background: theme.cyan }} />
                <div className="h-[0.32rem] w-[66%] rounded-full" style={{ background: theme.accent }} />
              </div>
            </InfoCard>

            <InfoCard
              theme={theme}
              float
              tilt={2}
              className="absolute right-0 top-0 w-[11.6rem] rounded-[1.9rem] px-5 py-5"
              style={{ background: 'rgba(26, 27, 27, 0.92)' }}
            >
              <div className="flex items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.14em]" style={{ color: theme.textSubtle }}>
                <div className="h-2 w-2 rounded-full" style={{ background: theme.cyan }} />
                live status
              </div>
              <div className="mt-2 font-headline text-[2.8rem] font-black leading-none tracking-[-0.08em]" style={{ color: '#ffffff' }}>
                85%
              </div>
              <div className="mt-2 text-[0.88rem] font-bold tracking-[-0.03em]" style={{ color: theme.cyan }}>
                Attendance Locked
              </div>
            </InfoCard>
          </div>

          <div className={compact ? 'pt-4' : 'pt-5'}>
            <div className="mb-3 flex justify-end">
              <div
                className="rounded-[0.08rem] px-4 py-2 text-[0.9rem] font-black uppercase tracking-[-0.04em]"
                style={{ background: theme.accent, color: theme.background, transform: 'rotate(-4deg)' }}
              >
                no lag zone
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/20" />
              <p className="font-headline text-[1rem] font-black uppercase tracking-[0.16em]" style={{ color: theme.textMuted }}>
                optimized core
              </p>
              <div className="h-px flex-1 bg-white/20" />
            </div>
          </div>
        </div>
      </OnboardingSlide>,
      <OnboardingSlide
        key="offline"
        index={2}
        isActive={activeIndex === 2}
        theme={theme}
        className={`${slideBaseClass} ${slidePadding}`}
        style={{ width: viewportWidth || undefined }}
      >
        <div className="flex h-full min-h-0 flex-col">
          <SlideItem className={compact ? 'mt-6' : 'mt-8'}>
            <h2 className={`font-headline font-bold leading-[0.92] tracking-[-0.08em] text-white ${subheadingSize}`}>
              offline?
              <span className="block" style={{ color: theme.accent }}>
                still works <span className="text-[0.86em]">😤</span>
              </span>
            </h2>
          </SlideItem>

          <SlideItem className={`mt-4 max-w-[18rem] ${bodyTextClass} font-semibold leading-[1.4] tracking-[-0.04em]`} style={{ color: theme.textMuted }}>
            <p>no internet? no problem. we got</p>
            <p>your data cached like a pro.</p>
          </SlideItem>

          <SlideItem className={compact ? 'mt-6' : 'mt-8'}>
            <InfoCard theme={theme} className={`${cardRadius} px-5 py-5`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full" style={{ background: 'rgba(81,219,255,0.12)', color: theme.cyan }}>
                    <HardDriveDownload size={17} strokeWidth={2.2} />
                  </div>
                  <div>
                    <div className="text-[0.68rem] font-black uppercase tracking-[0.16em]" style={{ color: theme.cyan }}>
                      system status
                    </div>
                    <div className="text-[0.98rem] font-bold tracking-[-0.04em]" style={{ color: '#ffffff' }}>
                      syncing to local storage
                    </div>
                  </div>
                </div>
                <div className="font-headline text-[1.85rem] font-black tracking-[-0.08em]" style={{ color: theme.accent }}>
                  88%
                </div>
              </div>
              <div className="mt-5">
                <ProgressFill active={activeIndex === 2} width="88%" theme={theme} delay={0.12} />
              </div>
            </InfoCard>
          </SlideItem>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <InfoCard theme={theme} className={`${cardRadius} px-5 py-5`}>
              <Database size={20} strokeWidth={2.1} style={{ color: theme.accent }} />
              <div className="mt-10 font-headline text-[2.2rem] font-black leading-none tracking-[-0.08em]" style={{ color: '#ffffff' }}>
                69kb
              </div>
              <div className="mt-2 text-[0.78rem] font-black uppercase tracking-[0.12em]" style={{ color: theme.textSubtle }}>
                cached locally
              </div>
            </InfoCard>

            <motion.div
              animate={activeIndex === 2 ? { y: [0, -5, 0] } : { y: 0 }}
              transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
              className={`${cardRadius} px-5 py-5`}
              style={{ background: theme.accent, color: theme.background }}
            >
              <WifiOff size={22} strokeWidth={2.4} />
              <div className="mt-10 font-headline text-[1.9rem] font-black leading-[0.92] tracking-[-0.07em] lowercase">
                always
                <br />
                accessible
              </div>
            </motion.div>
          </div>

          <div className={`flex-1 ${compact ? 'mt-4 space-y-3' : 'mt-5 space-y-4'}`}>
            {[
              { icon: <Zap size={15} strokeWidth={2.3} />, text: 'instant load times even in dead zones' },
              { icon: <Shield size={15} strokeWidth={2.3} />, text: 'military-grade device encryption' },
              { icon: <HardDriveDownload size={15} strokeWidth={2.3} />, text: 'auto-sync when back on the grid' },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-3 rounded-full px-4 py-3"
                style={{ background: 'rgba(31,31,31,0.92)', border: `1px solid ${theme.surfaceBorder}` }}
              >
                <div style={{ color: theme.cyan }}>{item.icon}</div>
                <div className="text-[0.88rem] font-bold tracking-[-0.03em]" style={{ color: theme.textMuted }}>
                  {item.text}
                </div>
              </div>
            ))}
          </div>

        </div>
      </OnboardingSlide>,
      <OnboardingSlide
        key="privacy"
        index={3}
        isActive={activeIndex === 3}
        theme={theme}
        backgroundNumber="04"
        className={`${slideBaseClass} ${slidePadding}`}
        style={{ width: viewportWidth || undefined }}
      >
        <div className="flex h-full min-h-0 flex-col">
          <SlideItem className={compact ? 'mt-7' : 'mt-9'}>
            <h2 className={`font-headline font-bold leading-[0.92] tracking-[-0.08em] text-white ${subheadingSize}`}>
              privacy = max
            </h2>
          </SlideItem>

          <SlideItem className={`mt-4 max-w-[17.5rem] ${bodyTextClass} font-semibold leading-[1.4] tracking-[-0.04em]`} style={{ color: theme.textMuted }}>
            <p>we don’t store your data. like</p>
            <p>literally. it stays on your device.</p>
          </SlideItem>

          <div className={`relative min-h-0 flex-1 ${compact ? 'mt-5' : 'mt-7'}`}>
            <InfoCard theme={theme} glow className={`${extraCompact ? 'h-[15.4rem] rounded-[2rem]' : 'h-[17.4rem] rounded-[2.45rem]'} px-6 py-6`}>
              <div
                className="absolute right-4 top-4 rounded-[0.1rem] px-4 py-2 text-[0.92rem] font-black uppercase tracking-[-0.04em]"
                style={{ background: theme.accent, color: theme.background, transform: 'rotate(8deg)' }}
              >
                zero knowledge
              </div>
              <div className="flex h-full flex-col items-center justify-center">
                <div
                  className="flex h-20 w-20 items-center justify-center"
                  style={{
                    clipPath: 'polygon(50% 0%, 95% 18%, 95% 68%, 50% 100%, 5% 68%, 5% 18%)',
                    background: theme.accent,
                    color: theme.background,
                  }}
                >
                  <LockKeyhole size={30} strokeWidth={2.2} />
                </div>
                <div className="mt-8 w-full">
                  <ProgressFill active={activeIndex === 3} width="68%" theme={theme} delay={0.14} />
                </div>
                <div className="mt-3 flex w-full justify-between text-[0.8rem] font-black uppercase tracking-[0.12em]">
                  <span style={{ color: theme.textSubtle }}>encrypting</span>
                  <span style={{ color: theme.accent }}>local only</span>
                </div>
              </div>
            </InfoCard>

          </div>

          <div className={`mt-4 border px-4 py-4 ${compact ? 'min-h-[6rem]' : 'min-h-[6.7rem]'}`} style={{ borderColor: 'rgba(255,255,255,0.46)', background: 'rgba(19, 19, 19, 0.88)' }}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-headline text-[1.55rem] font-black tracking-[-0.06em]" style={{ color: '#ffffff' }}>
                  no cloud storage
                </div>
                <p className="mt-1 max-w-[10.5rem] text-[0.84rem] font-semibold leading-[1.25] tracking-[-0.03em]" style={{ color: theme.textMuted }}>
                  your notes and creds never leave this phone. period.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-[4rem] w-[4rem] items-center justify-center rounded-full border" style={{ borderColor: theme.accentBorder, background: theme.accent }}>
                  <div className="h-4 w-4 rounded-full border-[3px]" style={{ borderColor: theme.background }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </OnboardingSlide>,
      <OnboardingSlide
        key="ready"
        index={4}
        isActive={activeIndex === 4}
        theme={theme}
        className={`${slideBaseClass} ${finalSlidePadding}`}
        style={{ width: viewportWidth || undefined }}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className={compact ? 'relative h-[9.5rem]' : 'relative h-[11rem]'}>
            <InfoCard theme={theme} float tilt={-5} className="absolute left-0 top-0 w-[14rem] rounded-[999px] px-5 py-4">
              <div className="text-[0.64rem] font-black uppercase tracking-[0.16em]" style={{ color: theme.textSubtle }}>
                status update
              </div>
              <div className="mt-1 text-[1rem] font-black tracking-[-0.04em]" style={{ color: '#ffffff' }}>
                academic comeback: active
              </div>
            </InfoCard>

            <InfoCard theme={theme} float tilt={0} className="absolute right-0 top-9 rounded-[999px] px-4 py-3">
              <div className="flex items-center gap-2 text-[0.76rem] font-black tracking-[-0.03em]" style={{ color: theme.textMuted }}>
                <BadgeCheck size={14} style={{ color: theme.cyan }} />
                system calibrated
              </div>
            </InfoCard>

            <motion.div
              animate={activeIndex === 4 ? { y: [0, -5, 0], rotate: [-4, -2, -4] } : { y: 0, rotate: -4 }}
              transition={{ duration: 4.4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute right-2 top-18 rounded-[0.1rem] px-4 py-3 text-[0.96rem] font-black tracking-[-0.04em]"
              style={{ background: theme.accent, color: theme.background }}
            >
              attendance: 98%
            </motion.div>
          </div>

          <SlideItem className={compact ? 'mt-3' : 'mt-6'}>
            <h2 className={`font-headline font-bold leading-[0.92] tracking-[-0.085em] text-white ${headingSize}`} style={{ textShadow: `0 0 20px ${theme.accentGlow}` }}>
              you’re ready
            </h2>
            <div className="mt-1 text-[2.5rem]">🚀</div>
          </SlideItem>

          <SlideItem className={`mt-3 max-w-[17.5rem] ${bodyTextClass} font-semibold leading-[1.4] tracking-[-0.04em]`} style={{ color: theme.textMuted }}>
            <p>go flex your attendance and</p>
            <p>survive academia.</p>
          </SlideItem>

          <div className={`mt-6 grid grid-cols-[1.05fr_0.95fr] gap-4 ${compact ? 'min-h-[9.5rem]' : 'min-h-[11rem]'}`}>
            <InfoCard theme={theme} className="overflow-hidden rounded-[2.2rem] p-0">
              <div
                className="relative flex h-full w-full items-end justify-between px-5 py-4"
                style={{
                  background:
                    'radial-gradient(circle at 35% 34%, rgba(255,255,255,0.16), transparent 18%), linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%), linear-gradient(180deg, #1b1b1b 0%, #101010 100%)',
                }}
              >
                <div className="absolute inset-x-0 top-3 flex justify-center">
                  <UserAvatar size={122} className="shadow-[0_0_28px_rgba(255,255,255,0.08)]" />
                </div>
                <div />
                <div className="mb-3 flex h-[3rem] w-[3rem] items-center justify-center rounded-full bg-white/18">
                  <BadgeCheck size={17} strokeWidth={2.2} style={{ color: '#ffffff' }} />
                </div>
              </div>
            </InfoCard>

            <div className="flex flex-col gap-4">
              <div className="flex h-[5.6rem] items-center rounded-[0.1rem] px-5" style={{ background: theme.cyan, color: '#123047' }}>
                <div className="font-headline text-[2.8rem] font-black tracking-[-0.08em]">A+</div>
              </div>
              <InfoCard theme={theme} className="rounded-[1.8rem] px-5 py-4">
                <div className="flex items-center gap-2 text-[0.78rem] font-black uppercase tracking-[0.12em]" style={{ color: theme.textMuted }}>
                  <div className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: theme.accent, color: theme.background }}>
                    <Zap size={11} />
                  </div>
                  powered by ai
                </div>
              </InfoCard>
            </div>
          </div>

          <div className="mt-auto pt-6">
            <div className="mb-4 flex justify-center">
              <ProgressDots count={totalSlides} activeIndex={activeIndex} theme={theme} />
            </div>
            <div className="relative">
              <CTAButton label="let’s go →" onClick={onFinish} theme={theme} variant="pill" />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <CTAButton label="finish onboarding" onClick={onFinish} theme={theme} />
              </div>
            </div>
          </div>
        </div>
      </OnboardingSlide>,
    ];

  return (
    <AnimatePresence>
      <motion.div
        key="onboarding-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.22 } }}
        className="absolute inset-0 z-[150] overflow-hidden rounded-[2rem]"
        style={{
          background: `radial-gradient(circle at 18% 16%, ${theme.accentGlow} 0%, transparent 26%), radial-gradient(circle at 82% 72%, rgba(0, 179, 255, 0.12) 0%, transparent 30%), linear-gradient(180deg, ${theme.background} 0%, #030504 100%)`,
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.04),_transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0)_22%)]" />

        <div
          ref={setViewportNode}
          className="swipe-viewport relative flex h-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none]"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehaviorX: 'contain',
            willChange: 'transform',
            transform: 'translate3d(0, 0, 0)',
          }}
          onTouchStart={(event) => {
            const touch = event.touches[0];
            if (!touch) return;

            clearNavigationMode();
            gestureLockRef.current = null;
            touchStartXRef.current = touch.clientX;
            touchStartYRef.current = touch.clientY;
          }}
          onTouchMove={(event) => {
            const touch = event.touches[0];
            if (!touch) return;

            const deltaX = touch.clientX - touchStartXRef.current;
            const deltaY = touch.clientY - touchStartYRef.current;

            if (!gestureLockRef.current) {
              if (Math.abs(deltaX) < 6 && Math.abs(deltaY) < 6) return;
              gestureLockRef.current = Math.abs(deltaX) > Math.abs(deltaY) * DIRECTION_LOCK_RATIO ? 'x' : 'y';
            }

            if (gestureLockRef.current === 'x') {
              toggleSwipeMode(true);
            }
          }}
          onTouchEnd={() => {
            gestureLockRef.current = null;

            if (settleTimerRef.current === null) {
              window.setTimeout(() => {
                toggleSwipeMode(false);
              }, 120);
            }
          }}
          onTouchCancel={() => {
            gestureLockRef.current = null;
            toggleSwipeMode(false);
          }}
          onScroll={(event) => {
            if (!viewportWidth) return;
            const viewport = event.currentTarget;

            toggleSwipeMode(true);

            if (settleTimerRef.current !== null) {
              window.clearTimeout(settleTimerRef.current);
            }

            settleTimerRef.current = window.setTimeout(() => {
              const nextIndex = Math.round(viewport.scrollLeft / viewportWidth);
              toggleSwipeMode(false);
              clearNavigationMode();
              settleTimerRef.current = null;
              if (nextIndex !== activeIndexRef.current) {
                stepNavigationSourceRef.current = 'swipe';
                setActiveIndex(Math.max(0, Math.min(totalSlides - 1, nextIndex)));
              }
            }, 70);
          }}
        >
          <div className="flex h-full min-w-full [&::-webkit-scrollbar]:hidden">
            {slides}
          </div>
        </div>

        {activeIndex < totalSlides - 1 ? (
          <BottomNav activeIndex={activeIndex} totalSlides={totalSlides} theme={theme} onNext={goNext} />
        ) : null}
      </motion.div>
    </AnimatePresence>
  );
}
