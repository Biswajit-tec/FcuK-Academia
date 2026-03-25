'use client';

import React, { startTransition, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import HomePage from '@/app/page';
import AttendancePage from '@/app/attendance/page';
import CalendarPage from '@/app/calendar/page';
import MarksPage from '@/app/marks/page';
import SettingsPage from '@/app/settings/page';
import TimetablePage from '@/app/timetable/page';
import Navbar from '@/components/layout/Navbar';
import IntroOverlay from '@/components/ui/IntroOverlay';
import { cn } from '@/lib/utils';

const HIDE_NAV_PATHS = ['/login'];
const SWIPEABLE_PATHS = ['/', '/marks', '/attendance', '/timetable', '/calendar', '/settings'] as const;
const TAB_SCREENS = [
  { href: '/', Component: HomePage },
  { href: '/marks', Component: MarksPage },
  { href: '/attendance', Component: AttendancePage },
  { href: '/timetable', Component: TimetablePage },
  { href: '/calendar', Component: CalendarPage },
  { href: '/settings', Component: SettingsPage },
] as const;
const SWIPE_THRESHOLD_PX = 72;
const SWIPE_VELOCITY_THRESHOLD = 0.35;
const DIRECTION_LOCK_RATIO = 1.1;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const touchStartTimeRef = useRef(0);
  const gestureLockRef = useRef<'x' | 'y' | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const hideNav = HIDE_NAV_PATHS.includes(pathname);
  const isSwipeablePath = SWIPEABLE_PATHS.includes(pathname as typeof SWIPEABLE_PATHS[number]);
  const routePath = isSwipeablePath ? pathname as typeof SWIPEABLE_PATHS[number] : '/';
  const [optimisticPath, setOptimisticPath] = useState<typeof SWIPEABLE_PATHS[number] | null>(null);
  const activePath = optimisticPath ?? routePath;
  const activeTabIndex = SWIPEABLE_PATHS.indexOf(activePath);
  const isSwipeableRoute = activeTabIndex !== -1;

  useEffect(() => {
    SWIPEABLE_PATHS.forEach((path) => {
      router.prefetch(path);
    });
  }, [router]);

  useEffect(() => {
    if (!optimisticPath || optimisticPath !== routePath) return;

    const frame = window.requestAnimationFrame(() => {
      setOptimisticPath(null);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [optimisticPath, routePath]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const updateWidth = () => {
      setContainerWidth(node.clientWidth);
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [isSwipeableRoute]);

  if (hideNav) {
    return <>{children}</>;
  }

  function navigateToPath(nextPath: typeof SWIPEABLE_PATHS[number]) {
    if (!nextPath || nextPath === activePath) return;
    setOptimisticPath(nextPath);
    setDragOffset(0);
    setIsDragging(false);
    startTransition(() => {
      router.replace(nextPath, { scroll: false });
    });
  }

  function handleTouchStart(event: React.TouchEvent<HTMLElement>) {
    if (!isSwipeableRoute) return;
    const touch = event.touches[0];
    if (!touch) return;
    gestureLockRef.current = null;
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    touchStartTimeRef.current = performance.now();
    setIsDragging(false);
  }

  function handleTouchMove(event: React.TouchEvent<HTMLElement>) {
    if (!isSwipeableRoute) return;

    const touch = event.touches[0];
    if (!touch) return;

    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;
    if (!gestureLockRef.current) {
      if (Math.abs(deltaX) < 6 && Math.abs(deltaY) < 6) return;
      gestureLockRef.current = Math.abs(deltaX) > Math.abs(deltaY) * DIRECTION_LOCK_RATIO ? 'x' : 'y';
    }

    if (gestureLockRef.current !== 'x') return;

    const atFirstTab = activeTabIndex === 0 && deltaX > 0;
    const atLastTab = activeTabIndex === SWIPEABLE_PATHS.length - 1 && deltaX < 0;
    const resistedOffset = atFirstTab || atLastTab ? deltaX * 0.32 : deltaX;

    setIsDragging(true);
    setDragOffset(resistedOffset);
    event.preventDefault();
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLElement>) {
    if (!isSwipeableRoute) return;
    const touch = event.changedTouches[0];
    if (!touch) return;

    const deltaX = touch.clientX - touchStartXRef.current;
    const elapsed = Math.max(1, performance.now() - touchStartTimeRef.current);
    const velocityX = Math.abs(deltaX / elapsed);

    if (gestureLockRef.current === 'x' && (Math.abs(deltaX) > SWIPE_THRESHOLD_PX || velocityX > SWIPE_VELOCITY_THRESHOLD)) {
      const nextIndex = activeTabIndex + (deltaX < 0 ? 1 : -1);
      const nextPath = SWIPEABLE_PATHS[nextIndex];
      if (nextPath) {
        navigateToPath(nextPath);
      }
    }

    gestureLockRef.current = null;
    setIsDragging(false);
    setDragOffset(0);
  }

  const translateX = containerWidth ? -(activeTabIndex * containerWidth) + dragOffset : dragOffset;

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-[28rem] overflow-x-hidden pb-40 sm:max-w-[34rem] lg:max-w-[44rem] xl:max-w-[52rem]">
      <IntroOverlay />

      {isSwipeableRoute ? (
        <main
          ref={containerRef}
          className="relative h-[calc(100dvh-9.5rem)] min-h-[calc(100dvh-9.5rem)] overflow-hidden"
          style={{ touchAction: 'pan-y' }}
        >
          <div
            className="flex h-full will-change-transform"
            style={{
              transform: `translate3d(${translateX}px, 0, 0)`,
              transition: isDragging ? 'none' : 'transform 0.3s ease-out',
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            {TAB_SCREENS.map(({ href, Component }) => (
              <section
                key={href}
                aria-hidden={href !== activePath}
                className={cn(
                  'h-full shrink-0 overflow-y-auto overscroll-y-contain touch-pan-y px-4 pt-6 sm:px-6 sm:pt-8',
                  href !== activePath && 'pointer-events-none',
                )}
                style={{ width: containerWidth ? `${containerWidth}px` : '100%' }}
              >
                <Component />
              </section>
            ))}
          </div>
        </main>
      ) : (
        <main className="px-4 pt-6 sm:px-6 sm:pt-8">
          {children}
        </main>
      )}

      <Navbar
        activePath={isSwipeableRoute ? activePath : pathname}
        onNavigate={isSwipeableRoute ? (href) => navigateToPath(href as typeof SWIPEABLE_PATHS[number]) : undefined}
      />
    </div>
  );
}
