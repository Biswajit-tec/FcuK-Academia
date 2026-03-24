'use client';

import React, { useMemo, useState } from 'react';
import { Bell, ChevronRight, LogOut, MoonStar, RefreshCw, School, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

import DayOrderSelector from '@/components/settings/DayOrderSelector';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';
import { useTheme } from '@/context/ThemeContext';
import { getInteractiveMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';

export default function SettingsPage() {
  const { theme, themeConfig, availableThemes, setTheme } = useTheme();
  const { user, loading } = useUser();
  const router = useRouter();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const motionProps = getInteractiveMotion(themeConfig.motion);

  const syncLabel = useMemo(() => {
    if (loading) return 'syncing live account data';
    if (!user) return 'session expired';
    return `semester ${user.semester} • batch ${user.batch}`;
  }, [loading, user]);

  async function handleLogout() {
    setLogoutLoading(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  return (
    <div className="space-y-6 pb-36 pt-2">
      <section className="space-y-4">
        <div className="space-y-2">
          <p className="theme-kicker">settings</p>
          <h1 className="font-headline text-[clamp(2.6rem,12vw,4.4rem)] font-bold leading-[0.9] text-on-surface">
            visual control
          </h1>
          <p className="max-w-sm text-sm text-on-surface-variant">
            tune palette, motion, and account preferences without breaking the mobile rhythm.
          </p>
        </div>

        <GlassCard className="space-y-4 p-5">
          <div className="flex items-start gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px]"
              style={{ background: 'var(--hero-gradient)', boxShadow: 'var(--glow-primary)' }}
            >
              <UserRound size={22} className="text-on-surface" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="theme-kicker">profile</p>
              <h2 className="mt-2 font-headline text-2xl font-bold text-on-surface">
                {user ? user.name.toLowerCase() : 'live srm session'}
              </h2>
              <p className="mt-2 text-sm text-on-surface-variant">
                {user ? `${user.regNumber} • ${user.department}` : 'your session details load here when account data is ready.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatPill label="theme" value={themeConfig.label} />
            <StatPill label="sync" value={syncLabel} />
          </div>
        </GlassCard>
      </section>

      <section className="space-y-4">
        <SectionHeading
          kicker="theme"
          title="pick the vibe"
          subtitle="eight compact skins with motion behavior baked into each theme."
        />

        <div className="-mx-4 overflow-x-auto px-4 pb-2">
          <div className="flex min-w-max gap-3">
            {availableThemes.map((option) => {
              const active = option.id === theme;

              return (
                <motion.button
                  key={option.id}
                  type="button"
                  whileHover={motionProps.whileHover}
                  whileTap={motionProps.whileTap}
                  transition={motionProps.transition}
                  onClick={() => setTheme(option.id)}
                  className={cn(
                    'relative flex min-w-[11.5rem] items-center gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-left',
                    active
                      ? 'shadow-[var(--glow-primary)]'
                      : ''
                  )}
                  style={{
                    borderColor: active ? 'var(--border-strong)' : 'var(--border)',
                    background: active
                      ? 'color-mix(in srgb, var(--surface-elevated) 92%, transparent)'
                      : 'color-mix(in srgb, var(--surface) 88%, transparent)',
                  }}
                >
                  <div className="flex gap-1.5">
                    {option.preview.map((color) => (
                      <span
                        key={color}
                        className="h-3.5 w-3.5 rounded-full border border-white/10"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-headline text-base font-bold text-on-surface">
                      {option.label}
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">
                      {option.category}
                      {option.isFemaleFocused ? ' • soft' : ''}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'h-2.5 w-2.5 rounded-full transition-all',
                      active ? 'bg-primary shadow-[var(--glow-primary)]' : ''
                    )}
                    style={active ? undefined : { background: 'color-mix(in srgb, var(--text-subtle) 50%, transparent)' }}
                  />
                </motion.button>
              );
            })}
          </div>
        </div>

        <GlassCard className="space-y-3 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="theme-kicker">active theme</p>
              <h3 className="mt-2 font-headline text-2xl font-bold text-on-surface">
                {themeConfig.label}
              </h3>
            </div>
            <div
              className="rounded-[var(--radius-pill)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]"
              style={{
                color: 'var(--text)',
                background: 'color-mix(in srgb, var(--primary) 18%, transparent)',
              }}
            >
              {themeConfig.motion.id}
            </div>
          </div>
          <p className="text-sm text-on-surface-variant">{themeConfig.description}</p>
        </GlassCard>
      </section>

      <section className="space-y-4">
        <SectionHeading
          kicker="preferences"
          title="daily controls"
          subtitle="tight, thumb-friendly cards for the settings you touch most often."
        />

        <div className="space-y-3">
          <PreferenceItem icon={Bell} title="notifications" subtitle={user?.mobile || 'stay updated on class alerts'} hasToggle motionProps={motionProps} />
          <PreferenceItem icon={School} title="course details" subtitle={user?.program || 'syllabus and credit management'} motionProps={motionProps} />
          <PreferenceItem icon={MoonStar} title="motion behavior" subtitle={themeConfig.motion.id.replace('-', ' ')} motionProps={motionProps} />
          <PreferenceItem icon={RefreshCw} title="sync" subtitle={syncLabel} actionIcon motionProps={motionProps} />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading
          kicker="others"
          title="layout + account"
          subtitle="secondary controls grouped into the same visual rhythm."
        />

        <DayOrderSelector />

        <div className="space-y-3">
          <PreferenceItem icon={ShieldCheck} title="privacy" subtitle={user?.department || 'manage data and session visibility'} motionProps={motionProps} />
          <PreferenceItem icon={Sparkles} title="appearance profile" subtitle={themeConfig.isFemaleFocused ? 'soft expressive palette enabled' : 'balanced premium palette enabled'} motionProps={motionProps} />
        </div>
      </section>

      <section className="space-y-4 pt-2">
        <Button variant="brutalist" fullWidth onClick={handleLogout} disabled={logoutLoading}>
          <LogOut size={26} />
          {logoutLoading ? 'logging out...' : 'abort mission / logout'}
        </Button>
        <p className="text-center text-[11px] uppercase tracking-[0.24em] text-on-surface-variant/70">
          {user ? `${user.name.toLowerCase()} • ${user.regNumber}` : 'live SRM session'}
        </p>
      </section>
    </div>
  );
}

function SectionHeading({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="space-y-2 px-1">
      <p className="theme-kicker">{kicker}</p>
      <h2 className="font-headline text-3xl font-bold text-on-surface">{title}</h2>
      <p className="max-w-sm text-sm text-on-surface-variant">{subtitle}</p>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-[var(--radius-md)] border px-4 py-3"
      style={{
        borderColor: 'var(--border)',
        background: 'color-mix(in srgb, var(--surface-soft) 90%, transparent)',
      }}
    >
      <p className="theme-kicker">{label}</p>
      <p className="mt-2 text-sm font-semibold capitalize text-on-surface">
        {value}
      </p>
    </div>
  );
}

function PreferenceItem({
  icon: Icon,
  title,
  subtitle,
  hasToggle,
  actionIcon,
  motionProps,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  subtitle: string;
  hasToggle?: boolean;
  actionIcon?: boolean;
  motionProps: ReturnType<typeof getInteractiveMotion>;
}) {
  return (
    <motion.button
      type="button"
      whileHover={motionProps.whileHover}
      whileTap={motionProps.whileTap}
      transition={motionProps.transition}
      className="theme-card flex w-full items-center justify-between p-4 text-left"
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-[18px] border',
            hasToggle ? 'text-secondary' : 'text-on-surface-variant'
          )}
          style={{
            borderColor: hasToggle ? 'var(--border-strong)' : 'var(--border)',
            background: hasToggle
              ? 'color-mix(in srgb, var(--secondary) 16%, transparent)'
              : 'color-mix(in srgb, var(--surface-soft) 88%, transparent)',
          }}
        >
          <Icon size={20} />
        </div>
        <div>
          <h3 className="font-headline text-xl font-bold text-on-surface">{title}</h3>
          <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p>
        </div>
      </div>
      {hasToggle ? (
        <div
          className="flex h-7 w-12 items-center rounded-[var(--radius-pill)] px-1"
          style={{ background: 'color-mix(in srgb, var(--secondary) 20%, transparent)' }}
        >
          <div className="ml-auto h-5 w-5 rounded-full bg-secondary shadow-[var(--glow-secondary)]" />
        </div>
      ) : actionIcon ? (
        <RefreshCw size={18} className="text-on-surface-variant" />
      ) : (
        <ChevronRight size={18} className="text-on-surface-variant" />
      )}
    </motion.button>
  );
}
