'use client';

import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function hasFirebaseConfig() {
  return Object.values(firebaseConfig).every((value) => typeof value === 'string' && value.length > 0);
}

export function isFirebaseClientConfigured() {
  return hasFirebaseConfig();
}

export const app: FirebaseApp | null = hasFirebaseConfig()
  ? (getApps()[0] ?? initializeApp(firebaseConfig))
  : null;

export async function getFirebaseMessagingClient() {
  if (typeof window === 'undefined' || !app) return null;

  const { getMessaging, isSupported } = await import('firebase/messaging');
  if (!(await isSupported())) {
    return null;
  }

  return getMessaging(app);
}

export function getFirebasePublicConfig() {
  return firebaseConfig;
}
