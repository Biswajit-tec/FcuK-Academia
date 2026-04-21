'use client';

import React, { useEffect, useMemo, useState } from 'react';

import { NOTIFICATIONS_INSTALL_PROMPT_DISMISSED_KEY } from '@/lib/notifications/constants';
import { isAndroidDevice, isInstalledPwa, isIosDevice, isMobileDevice } from '@/lib/notifications/platform';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function readDismissedState() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(NOTIFICATIONS_INSTALL_PROMPT_DISMISSED_KEY) === 'true';
}

function persistDismissedState() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(NOTIFICATIONS_INSTALL_PROMPT_DISMISSED_KEY, 'true');
}

export default function InstallGate({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDismissed(readDismissedState());
    setIsInstalled(isInstalledPwa());

    if (isIosDevice()) {
      setPlatform('ios');
      return;
    }

    if (isAndroidDevice()) {
      setPlatform('android');
      return;
    }

    if (isMobileDevice()) {
      setPlatform('other');
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [mounted]);

  const shouldShowPrompt = useMemo(() => {
    if (!mounted || dismissed || isInstalled || !isMobileDevice()) {
      return false;
    }

    if (platform === 'ios') {
      return true;
    }

    if (platform === 'android') {
      return Boolean(deferredPrompt);
    }

    return false;
  }, [deferredPrompt, dismissed, isInstalled, mounted, platform]);

  const dismissPrompt = () => {
    persistDismissedState();
    setDismissed(true);
  };

  const handleInstall = async () => {
    if (!deferredPrompt || installing) return;

    setInstalling(true);

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } finally {
      setInstalling(false);
    }
  };

  return (
    <>
      {children}
      {shouldShowPrompt ? (
        <div
          className="pointer-events-none fixed inset-x-0 z-[65] flex justify-center px-4 sm:px-6 xl:px-8"
          style={{ bottom: 'calc(5.75rem + env(safe-area-inset-bottom))' }}
        >
          <div
            className="pointer-events-auto w-full max-w-[28rem] rounded-full border px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:max-w-[32rem]"
            style={{
              borderColor: 'color-mix(in srgb, var(--border-strong) 48%, transparent)',
              background: 'color-mix(in srgb, var(--surface-elevated) 92%, transparent)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold uppercase tracking-[0.16em]"
                style={{
                  borderColor: 'color-mix(in srgb, var(--primary) 28%, transparent)',
                  background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
                  color: 'var(--primary)',
                }}
              >
                app
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-on-surface">
                  {platform === 'android' ? 'Install the app for faster launch and better push delivery.' : 'Install this PWA to enable iPhone push notifications.'}
                </p>
                <p className="mt-0.5 text-xs leading-5 text-on-surface-variant">
                  {platform === 'android' ? 'Add it to your home screen in one tap.' : 'Tap Share -> Add to Home Screen, then enable notifications in Settings.'}
                </p>
              </div>

              {platform === 'android' ? (
                <button
                  type="button"
                  onClick={() => {
                    void handleInstall();
                  }}
                  disabled={installing}
                  className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-black disabled:opacity-70"
                  style={{
                    background: 'var(--primary)',
                    boxShadow: 'var(--glow-primary)',
                  }}
                >
                  {installing ? 'wait' : 'install'}
                </button>
              ) : null}

              <button
                type="button"
                onClick={dismissPrompt}
                className="shrink-0 rounded-full border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant"
                style={{
                  borderColor: 'color-mix(in srgb, var(--border) 84%, transparent)',
                }}
                aria-label="Dismiss install prompt"
              >
                close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
