'use client';

import dynamic from 'next/dynamic';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';

import { evaluateNotificationEngine, getNextNotificationEngineDelay } from '@/lib/notificationEngine';
import {
  clearNotificationToken,
  getNotificationToken,
  requestNotificationPermission,
  syncNotificationToken,
} from '@/lib/notifications/getToken';
import {
  NOTIFICATIONS_DEFAULT_DURATION_MS,
  NOTIFICATIONS_STACK_LIMIT,
} from '@/lib/notifications/constants';
import {
  getNotificationsEnabledPreference,
  setNotificationsEnabledPreference,
  setStoredNotificationPermission,
} from '@/lib/notifications/storage';
import { playNotificationSound, primeNotificationAudio } from '@/lib/notifications/sounds';
import type {
  NotificationPermissionState,
  NotificationPayload,
  NotificationToastItem,
  NotificationType,
} from '@/lib/notifications/types';
import { useDashboardDataContext } from '@/context/DashboardDataContext';

const NotificationStack = dynamic(() => import('@/components/notifications/NotificationStack'), {
  ssr: false,
});

interface NotificationContextValue {
  notificationsEnabled: boolean;
  permissionState: NotificationPermissionState;
  notificationQueue: NotificationToastItem[];
  triggerNotification: (type: NotificationType, payload: Omit<NotificationPayload, 'type'>) => void;
  dismissNotification: (id: string) => void;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

function resolvePermissionState(): NotificationPermissionState {
  if (typeof window === 'undefined') return 'unknown';
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

function createToastItem(payload: NotificationPayload): NotificationToastItem {
  return {
    ...payload,
    id: payload.id ?? `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    durationMs: payload.durationMs ?? NOTIFICATIONS_DEFAULT_DURATION_MS,
  };
}

function fromFcmPayload(payload: Record<string, unknown>): NotificationPayload | null {
  const data = (payload.data && typeof payload.data === 'object' ? payload.data : {}) as Record<string, unknown>;
  const title = String(data.title ?? '').trim();
  const message = String(data.message ?? '').trim();

  if (!title || !message) return null;

  const nextType = ['good', 'bad', 'warning', 'class', 'broadcast', 'system'].includes(String(data.type))
    ? data.type as NotificationType
    : 'broadcast';

  return {
    title,
    message,
    type: nextType,
    sound: (typeof data.sound === 'string' ? data.sound : nextType) as NotificationPayload['sound'],
    deepLink: typeof data.deepLink === 'string' ? data.deepLink : '/',
    source: 'fcm',
  };
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    attendance,
    calendar,
    loading,
    markList,
    timetable,
  } = useDashboardDataContext();
  const [notificationsEnabled, setNotificationsEnabledState] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>('unknown');
  const [notificationQueue, setNotificationQueue] = useState<NotificationToastItem[]>([]);
  const engineTimerRef = useRef<number | null>(null);

  const dismissNotification = useCallback((id: string) => {
    setNotificationQueue((current) => current.filter((item) => item.id !== id));
  }, []);

  const enqueueNotification = useCallback((payload: NotificationPayload) => {
    const item = createToastItem(payload);

    setNotificationQueue((current) => [item, ...current].slice(0, NOTIFICATIONS_STACK_LIMIT));

    if (!payload.silent) {
      void playNotificationSound(payload.sound ?? payload.type);
    }
  }, []);

  const triggerNotification = useCallback<NotificationContextValue['triggerNotification']>((type, payload) => {
    enqueueNotification({
      ...payload,
      type,
    });
  }, [enqueueNotification]);

  const refreshPushToken = useCallback(async () => {
    if (!notificationsEnabled) return;

    const permission = await requestNotificationPermission();
    setPermissionState(permission);
    setStoredNotificationPermission(permission);

    if (permission !== 'granted') {
      return;
    }

    const token = await getNotificationToken();
    if (token) {
      await syncNotificationToken(token);
    }
  }, [notificationsEnabled]);

  const runNotificationEngine = useCallback(() => {
    if (!notificationsEnabled || loading || pathname === '/login') return;

    const nextNotifications = evaluateNotificationEngine({
      attendance,
      markList,
      timetable,
      calendar,
    });

    nextNotifications.forEach((payload) => enqueueNotification(payload));
  }, [attendance, calendar, enqueueNotification, loading, markList, notificationsEnabled, pathname, timetable]);

  const clearEngineTimer = useCallback(() => {
    if (engineTimerRef.current !== null) {
      window.clearTimeout(engineTimerRef.current);
      engineTimerRef.current = null;
    }
  }, []);

  const scheduleNotificationEngine = useCallback(() => {
    clearEngineTimer();

    if (!notificationsEnabled || pathname === '/login') return;

    const delay = getNextNotificationEngineDelay({
      timetable,
      calendar,
      now: new Date(),
    });

    if (delay === null) return;

    engineTimerRef.current = window.setTimeout(() => {
      engineTimerRef.current = null;
      runNotificationEngine();
      scheduleNotificationEngine();
    }, Math.max(delay, 1000));
  }, [calendar, clearEngineTimer, notificationsEnabled, pathname, runNotificationEngine, timetable]);

  const setNotificationsEnabled = useCallback(async (enabled: boolean) => {
    setNotificationsEnabledPreference(enabled);
    setNotificationsEnabledState(enabled);

    if (!enabled) {
      clearEngineTimer();
      await clearNotificationToken();
      enqueueNotification({
        title: 'notification mode off',
        message: 'silence restored. no push, no buzz, no academic jump-scares.',
        type: 'system',
        sound: 'warning',
        source: 'settings',
      });
      return;
    }

    const permission = await requestNotificationPermission();
    setPermissionState(permission);
    setStoredNotificationPermission(permission);

    if (permission === 'granted') {
      await refreshPushToken();
      enqueueNotification({
        title: 'notifications unlocked',
        message: 'FCM is armed. now the app can ping you before academia does.',
        type: 'good',
        sound: 'good',
        source: 'settings',
      });
      scheduleNotificationEngine();
      return;
    }

    enqueueNotification({
      title: 'fallback mode active',
      message: permission === 'denied'
        ? 'push permission said no, so we are sticking to in-app alerts only.'
        : 'device push is not supported here, but in-app alerts are still live.',
      type: 'warning',
      sound: 'warning',
      source: 'settings',
    });
    scheduleNotificationEngine();
  }, [clearEngineTimer, enqueueNotification, refreshPushToken, scheduleNotificationEngine]);

  useEffect(() => {
    primeNotificationAudio();
    setNotificationsEnabledState(getNotificationsEnabledPreference());
    setPermissionState(resolvePermissionState());
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!notificationsEnabled || pathname === '/login') return;

      if (document.visibilityState === 'hidden') {
        clearEngineTimer();
        return;
      }

      void refreshPushToken();
      runNotificationEngine();
      scheduleNotificationEngine();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [clearEngineTimer, notificationsEnabled, pathname, refreshPushToken, runNotificationEngine, scheduleNotificationEngine]);

  useEffect(() => {
    if (!notificationsEnabled || pathname === '/login') {
      clearEngineTimer();
      return;
    }

    runNotificationEngine();
    scheduleNotificationEngine();

    return () => {
      clearEngineTimer();
    };
  }, [clearEngineTimer, notificationsEnabled, pathname, runNotificationEngine, scheduleNotificationEngine]);

  useEffect(() => {
    if (!notificationsEnabled || pathname === '/login') return;

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    const setupForegroundMessaging = async () => {
      try {
        const { getFirebaseMessagingClient } = await import('@/lib/firebase');
        const messaging = await getFirebaseMessagingClient();
        if (!messaging || cancelled) return;

        await refreshPushToken();

        const { onMessage } = await import('firebase/messaging');
        unsubscribe = onMessage(messaging, (payload) => {
          const nextPayload = fromFcmPayload(payload as unknown as Record<string, unknown>);
          if (!nextPayload) return;

          triggerNotification(nextPayload.type, {
            title: nextPayload.title,
            message: nextPayload.message,
            sound: nextPayload.sound,
            deepLink: nextPayload.deepLink,
            source: nextPayload.source,
            metadata: nextPayload.metadata,
            silent: nextPayload.silent,
            durationMs: nextPayload.durationMs,
          });
        });
      } catch {
        // FCM is optional at runtime; fallback notifications continue to work.
      }
    };

    void setupForegroundMessaging();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [notificationsEnabled, pathname, refreshPushToken, triggerNotification]);

  const value = useMemo<NotificationContextValue>(() => ({
    notificationsEnabled,
    permissionState,
    notificationQueue,
    triggerNotification,
    dismissNotification,
    setNotificationsEnabled,
  }), [
    dismissNotification,
    notificationQueue,
    notificationsEnabled,
    permissionState,
    setNotificationsEnabled,
    triggerNotification,
  ]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationStack items={notificationQueue} dismissNotification={dismissNotification} />
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }

  return context;
}
