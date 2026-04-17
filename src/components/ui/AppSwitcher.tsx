'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} width="1.2em" height="1.2em">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 22.5l-.813-6.596L2.25 15l6.596-.813L9 7.5l.813 6.596L15.75 15l-5.937.904zm9.333-8.875L18.75 10.5l-.396-3.471L15 6.75l3.354-.279L18.75 3l.396 3.471L22.5 6.75l-3.354.279z" />
    </svg>
  );
}

export default function AppSwitcher() {
  const pathname = usePathname();
  const { themeConfig } = useTheme();
  const isPyqs = pathname.startsWith('/pyqs');

  // Grab theme colors for gradients
  const primary = themeConfig.colors.primary;
  const secondary = themeConfig.colors.secondary;
  const accent = themeConfig.colors.accent;

  // "JioHotstar" style: dark center with colorful gradient border
  const InactiveButton = ({ title, isPyq }: { title: string; isPyq?: boolean }) => (
    <motion.div
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      className="relative w-full rounded-[18px] p-[1.5px]"
      style={{
        background: `linear-gradient(to right, ${primary}, ${secondary}, ${accent})`
      }}
    >
      <div className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[17px] bg-[#0A0A0A] px-2 transition-colors hover:bg-black/90 text-white">
        <SparkleIcon className="text-white opacity-80" />
        <span className={cn(
          "font-headline text-[11px] sm:text-base tracking-wide whitespace-nowrap",
          isPyq ? "font-black uppercase tracking-tighter italic" : "font-bold"
        )}>
          {title}
        </span>
      </div>
    </motion.div>
  );

  // "TADKA" style: solid vibrant gradient
  const ActiveButton = ({ title, isPyq }: { title: string; isPyq?: boolean }) => (
    <motion.div
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[18px] px-2 text-white shadow-xl shadow-primary/20"
      style={{
        background: `linear-gradient(135deg, ${secondary}, ${primary}, ${accent})`,
      }}
    >
      <SparkleIcon className="text-white" />
      <span className={cn(
        "font-headline text-[11px] sm:text-base tracking-wide drop-shadow-lg whitespace-nowrap",
        isPyq ? "font-black uppercase tracking-tighter italic" : "font-bold"
      )}>
        {title}
      </span>
    </motion.div>
  );

  return (
    <div className="flex w-full gap-3 mb-2">
      <Link href="/" className="flex-1 min-w-0 flex">
        {!isPyqs ? (
          <ActiveButton title="FcuK Academia" />
        ) : (
          <InactiveButton title="FcuK Academia" />
        )}
      </Link>

      <Link href="/pyqs" className="flex-1 min-w-0 flex">
        {isPyqs ? (
          <ActiveButton title="PYQs" isPyq />
        ) : (
          <InactiveButton title="PYQs" isPyq />
        )}
      </Link>
    </div>
  );
}

