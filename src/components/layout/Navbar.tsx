'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { Home, BarChart2, CheckSquare, Clock, Calendar, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: Home, label: 'home' },
  { href: '/marks', icon: BarChart2, label: 'marks' },
  { href: '/attendance', icon: CheckSquare, label: 'attendance' },
  { href: '/timetable', icon: Clock, label: 'timetable' },
  { href: '/calendar', icon: Calendar, label: 'calendar' },
  { href: '/settings', icon: Settings, label: 'settings' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMounted(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <nav
      className="fixed bottom-4 left-1/2 z-50 w-[90%] max-w-md -translate-x-1/2 px-1 pb-[max(env(safe-area-inset-bottom),0px)]"
      aria-label="Primary"
    >
      <div className="relative overflow-hidden rounded-full border border-white/[0.08] bg-[rgba(255,255,255,0.05)] px-3 py-3 backdrop-blur-[24px] shadow-[0_16px_30px_rgba(0,0,0,0.38),0_0_40px_rgba(163,255,18,0.25)]">
        <div className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.04)_24%,rgba(255,255,255,0.02)_50%,rgba(255,255,255,0.01)_100%)]" />
        <div className="pointer-events-none absolute inset-[1px] rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.04)_18%,rgba(255,255,255,0)_42%)]" />
        <div className="pointer-events-none absolute inset-x-6 top-[1px] h-1/2 rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.08)_18%,rgba(255,255,255,0)_70%)] blur-md" />
        <div className="pointer-events-none absolute inset-x-10 -bottom-5 h-10 rounded-full bg-[radial-gradient(circle,rgba(163,255,18,0.26)_0%,rgba(163,255,18,0.10)_42%,rgba(163,255,18,0)_74%)] blur-2xl" />

        <div className="relative grid grid-cols-6 items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            const itemClassName = cn(
              'relative flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 ease-out',
              isActive
                ? 'scale-110 text-primary'
                : 'scale-100 text-[#8d8d8d]',
            );

            const iconGlowClassName = cn(
              'absolute inset-0 rounded-full transition-all duration-300 ease-out',
              isActive
                ? 'bg-[radial-gradient(circle,rgba(182,255,0,0.18)_0%,rgba(0,224,255,0.10)_45%,rgba(255,255,255,0.02)_72%,rgba(255,255,255,0)_100%)] shadow-[0_0_16px_rgba(163,255,18,0.22),0_0_28px_rgba(0,224,255,0.14),inset_0_1px_0_rgba(255,255,255,0.10)]'
                : 'bg-transparent',
            );

            const iconHighlightClassName = cn(
              'absolute inset-[1px] rounded-full transition-opacity duration-300',
              isActive
                ? 'opacity-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0)_100%)]'
                : 'opacity-0',
            );

            const iconClassName = cn(
              'relative z-10 transition-all duration-300 ease-out',
              isActive
                ? 'drop-shadow-[0_0_10px_rgba(163,255,18,0.7)]'
                : 'drop-shadow-none',
            );

            const content = (
              <>
                <div className={iconGlowClassName} />
                <div className={iconHighlightClassName} />
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 2.1}
                  className={iconClassName}
                />
              </>
            );

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className="relative flex items-center justify-center"
              >
                {mounted ? (
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className={itemClassName}
                  >
                    {content}
                  </motion.div>
                ) : (
                  <div className={itemClassName}>
                    {content}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
