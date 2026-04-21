'use client';

import { useEffect } from 'react';

import { getFirebaseMessagingServiceWorkerRegistration } from '@/lib/notifications/getToken';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    const registerServiceWorker = () => {
      void getFirebaseMessagingServiceWorkerRegistration();
    };

    if (document.readyState === 'complete') {
      registerServiceWorker();
      return;
    }

    window.addEventListener('load', registerServiceWorker, { once: true });

    return () => {
      window.removeEventListener('load', registerServiceWorker);
    };
  }, []);

  return null;
}
