'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';

import Navbar from '@/components/layout/Navbar';

const HIDE_NAV_PATHS = ['/login'];
const SWIPEABLE_PATHS = ['/', '/marks', '/attendance', '/timetable', '/calendar'] as const;
const SWIPE_THRESHOLD = 72;
const SWIPE_VELOCITY_THRESHOLD = 420;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [navigationDirection, setNavigationDirection] = useState(0);
  const hideNav = HIDE_NAV_PATHS.includes(pathname);
  const activeTabIndex = SWIPEABLE_PATHS.indexOf(pathname as typeof SWIPEABLE_PATHS[number]);
  const isSwipeableRoute = activeTabIndex !== -1;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMounted(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (hideNav) {
    return <>{children}</>;
  }

  function handleSwipeNavigation(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (!isSwipeableRoute) return;

    const horizontalDistance = info.offset.x;
    const horizontalVelocity = info.velocity.x;
    const shouldMove =
      Math.abs(horizontalDistance) >= SWIPE_THRESHOLD ||
      Math.abs(horizontalVelocity) >= SWIPE_VELOCITY_THRESHOLD;

    if (!shouldMove) return;

    const swipeDirection = horizontalDistance < 0 || horizontalVelocity < 0 ? 1 : -1;
    const nextIndex = activeTabIndex + swipeDirection;
    const nextPath = SWIPEABLE_PATHS[nextIndex];

    if (!nextPath || nextPath === pathname) return;
    setNavigationDirection(swipeDirection);
    router.push(nextPath);
  }

  return (
    <div className="relative min-h-screen pb-40 max-w-md mx-auto overflow-x-hidden">
      {!mounted ? (
        <main className="px-4 sm:px-6 pt-6 sm:pt-8">
          {children}
        </main>
      ) : (
      <AnimatePresence mode="wait" initial={false} custom={navigationDirection}>
        <motion.main
          key={pathname}
          custom={navigationDirection}
          initial={{ opacity: 0.72, x: navigationDirection >= 0 ? 44 : -44, scale: 0.985 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0.72, x: navigationDirection >= 0 ? -44 : 44, scale: 0.985 }}
          transition={{
            x: { type: 'spring', stiffness: 360, damping: 34, mass: 0.85 },
            opacity: { duration: 0.2, ease: 'easeOut' },
            scale: { duration: 0.22, ease: 'easeOut' },
          }}
          drag={isSwipeableRoute ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.16}
          dragMomentum
          dragDirectionLock
          onDragEnd={handleSwipeNavigation}
          className="px-4 sm:px-6 pt-6 sm:pt-8 touch-pan-y"
          style={{ touchAction: 'pan-y' }}
        >
          {children}
        </motion.main>
      </AnimatePresence>
      )}
      <Navbar />
    </div>
  );
}
