'use client';

type EventParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
    __gaInitialized?: boolean;
    __gaLastTrackedPagePath?: string;
  }
}

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? '';

export function isGAEnabled() {
  return typeof window !== 'undefined' && process.env.NODE_ENV === 'production' && Boolean(GA_MEASUREMENT_ID);
}

export function getGAMeasurementId() {
  return GA_MEASUREMENT_ID;
}

export function initGA() {
  if (!isGAEnabled() || window.__gaInitialized) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false });
  window.__gaInitialized = true;
}

export function trackPageView(path: string) {
  if (!isGAEnabled() || !path) return;

  initGA();

  if (window.__gaLastTrackedPagePath === path) return;

  window.__gaLastTrackedPagePath = path;
  window.gtag?.('config', GA_MEASUREMENT_ID, {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

export function trackEvent(name: string, params: EventParams = {}) {
  if (!isGAEnabled() || !name) return;

  initGA();
  window.gtag?.('event', name, params);
}
