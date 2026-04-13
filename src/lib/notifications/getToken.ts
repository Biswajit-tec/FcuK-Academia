'use client';

import { getFirebaseMessagingClient, getFirebasePublicConfig, isFirebaseClientConfigured } from '@/lib/firebase';
import {
  NOTIFICATIONS_DEVICE_API,
  NOTIFICATIONS_FCM_SW_PATH,
  NOTIFICATIONS_FCM_SW_SCOPE,
} from '@/lib/notifications/constants';
import {
  clearStoredFcmToken,
  getStoredFcmToken,
  setStoredFcmToken,
  setStoredNotificationPermission,
} from '@/lib/notifications/storage';

function supportsPushNotifications() {
  return typeof window !== 'undefined'
    && 'Notification' in window
    && 'serviceWorker' in navigator
    && 'PushManager' in window;
}

function createMessagingServiceWorkerUrl() {
  const url = new URL(NOTIFICATIONS_FCM_SW_PATH, window.location.origin);
  const config = getFirebasePublicConfig();

  Object.entries(config).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

export async function getFirebaseMessagingServiceWorkerRegistration() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;

  return navigator.serviceWorker.register(createMessagingServiceWorkerUrl(), {
    scope: NOTIFICATIONS_FCM_SW_SCOPE,
    updateViaCache: 'none',
  });
}

export async function syncNotificationToken(token: string) {
  try {
    await fetch(NOTIFICATIONS_DEVICE_API, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        permission: typeof Notification !== 'undefined' ? Notification.permission : 'unknown',
        platform: navigator.userAgent,
      }),
    });
  } catch {
    // Silent fallback: local token storage still allows in-app notifications to work.
  }
}

export async function removeNotificationToken(token?: string | null) {
  const resolvedToken = token ?? getStoredFcmToken();
  if (!resolvedToken) return;

  try {
    await fetch(NOTIFICATIONS_DEVICE_API, {
      method: 'DELETE',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: resolvedToken }),
    });
  } catch {
    // Ignore cleanup failures so disabling notifications is never blocked.
  }
}

export async function requestNotificationPermission() {
  if (!supportsPushNotifications()) {
    return 'unsupported' as const;
  }

  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    setStoredNotificationPermission(Notification.permission);
    return Notification.permission;
  }

  const permission = await Notification.requestPermission();
  setStoredNotificationPermission(permission);
  return permission;
}

export async function getNotificationToken(options?: { forceRefresh?: boolean }) {
  if (!supportsPushNotifications() || !isFirebaseClientConfigured()) return null;

  const existingToken = getStoredFcmToken();
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    return null;
  }

  const messaging = await getFirebaseMessagingClient();
  if (!messaging) {
    return null;
  }

  const { getToken } = await import('firebase/messaging');
  const registration = await getFirebaseMessagingServiceWorkerRegistration();
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    return null;
  }

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration ?? undefined,
  });

  if (!token) {
    return existingToken;
  }

  if (token !== existingToken || options?.forceRefresh) {
    setStoredFcmToken(token);
    await syncNotificationToken(token);
  }

  return token;
}

export async function clearNotificationToken() {
  const storedToken = getStoredFcmToken();

  try {
    const messaging = await getFirebaseMessagingClient();
    const registration = await getFirebaseMessagingServiceWorkerRegistration();

    if (messaging) {
      const { deleteToken } = await import('firebase/messaging');
      await deleteToken(messaging);
    }

    if (registration) {
      await registration.unregister();
    }
  } catch {
    // Ignore errors and continue with local cleanup.
  } finally {
    await removeNotificationToken(storedToken);
    clearStoredFcmToken();
  }
}
