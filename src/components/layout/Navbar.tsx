'use client';

import React, { memo, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { Home, BarChart2, CheckSquare, Clock, Calendar, Settings, type LucideIcon } from 'lucide-react';

import { useTheme } from '@/context/ThemeContext';
import { getInteractiveMotion } from '@/lib/motion';
import type { ThemeMotionPreset } from '@/lib/types';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: Home, label: 'home' },
  { href: '/marks', icon: BarChart2, label: 'marks' },
  { href: '/attendance', icon: CheckSquare, label: 'attendance' },
  { href: '/timetable', icon: Clock, label: 'timetable' },
  { href: '/calendar', icon: Calendar, label: 'calendar' },
  { href: '/settings', icon: Settings, label: 'settings' },
];

interface NavbarProps {
  activePath?: string;
  onNavigate?: (href: string) => void;
}

interface NavItemButtonProps {
  href: string;
  icon: LucideIcon;
  isActive: boolean;
  label: string;
  motionPreset: ThemeMotionPreset;
  mounted: boolean;
  onNavigate?: (href: string) => void;
}

const NavItemButton = memo(function NavItemButton({
  href,
  icon: Icon,
  isActive,
  label,
  motionPreset,
  mounted,
  onNavigate,
}: NavItemButtonProps) {
  const motionProps = getInteractiveMotion(motionPreset);
  const itemClassName = cn(
    'relative flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 ease-out',
    isActive
      ? 'scale-110 text-primary'
      : 'scale-100 text-on-surface-variant',
  );

  const iconGlowClassName = cn(
    'absolute inset-0 rounded-full transition-all duration-300 ease-out',
    isActive
      ? 'shadow-[var(--glow-primary)]'
      : 'bg-transparent',
  );

  const iconHighlightClassName = cn(
    'absolute inset-[1px] rounded-full transition-opacity duration-300',
    isActive
      ? 'opacity-100'
      : 'opacity-0',
  );

  const iconClassName = cn(
    'relative z-10 transition-all duration-300 ease-out',
    isActive
      ? ''
      : 'drop-shadow-none',
  );

  const content = (
    <>
      <div
        className={iconGlowClassName}
        style={isActive ? { background: 'var(--hero-gradient)' } : undefined}
      />
      <div
        className={iconHighlightClassName}
        style={isActive ? { background: 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 48%, rgba(255,255,255,0) 100%)' } : undefined}
      />
      <Icon
        size={22}
        strokeWidth={isActive ? 2.5 : 2.1}
        className={iconClassName}
        style={isActive ? { filter: 'drop-shadow(0 0 10px color-mix(in srgb, var(--primary) 64%, transparent))' } : undefined}
      />
    </>
  );

  const inner = mounted ? (
    <motion.div
      whileHover={motionProps.whileHover}
      whileTap={motionProps.whileTap}
      transition={motionProps.transition}
      className={itemClassName}
    >
      {content}
    </motion.div>
  ) : (
    <div className={itemClassName}>
      {content}
    </div>
  );

  if (onNavigate) {
    return (
      <button
        type="button"
        aria-label={label}
        onClick={() => onNavigate(href)}
        className="relative flex items-center justify-center bg-transparent"
      >
        {inner}
      </button>
    );
  }

  return (
    <Link
      href={href}
      aria-label={label}
      className="relative flex items-center justify-center"
    >
      {inner}
    </Link>
  );
});

function Navbar({ activePath, onNavigate }: NavbarProps) {
  const pathname = usePathname();
  const { themeConfig } = useTheme();
  const [mounted, setMounted] = useState(false);
  const resolvedPath = activePath ?? (pathname.startsWith('/settings') ? '/settings' : pathname);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMounted(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <nav
      className="fixed bottom-4 left-1/2 z-50 w-[min(92%,28rem)] max-w-[28rem] -translate-x-1/2 px-1 sm:w-[min(92%,30rem)] sm:max-w-[30rem] lg:w-[min(88%,34rem)] lg:max-w-[34rem]"
      aria-label="Primary"
    >
      <div
        className="relative overflow-hidden rounded-[var(--radius-pill)] border px-3 pt-3 backdrop-blur-[16px]"
        style={{
          borderColor: 'var(--card-border)',
          background: 'var(--nav-background)',
          boxShadow: 'var(--elevation-nav)',
          paddingBottom: 'calc(0.75rem + max(env(safe-area-inset-bottom), 0px))',
        }}
      >
        <div className="pointer-events-none absolute inset-0 rounded-[inherit]" style={{ background: 'var(--surface-gradient)' }} />

        <div className="relative grid grid-cols-6 items-center gap-1">
          {navItems.map((item) => {
            return (
              <NavItemButton
                key={item.href}
                href={item.href}
                icon={item.icon}
                isActive={resolvedPath === item.href}
                label={item.label}
                motionPreset={themeConfig.motion}
                mounted={mounted}
                onNavigate={onNavigate}
              />
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default memo(Navbar);
