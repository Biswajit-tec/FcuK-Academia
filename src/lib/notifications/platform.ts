'use client';

function getUserAgent() {
  if (typeof navigator === 'undefined') return '';
  return navigator.userAgent.toLowerCase();
}

export function isIosDevice() {
  if (typeof navigator === 'undefined') return false;

  const userAgent = getUserAgent();
  const isClassicIos = /iphone|ipad|ipod/.test(userAgent);
  const isTouchMac = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;

  return isClassicIos || isTouchMac;
}

export function isAndroidDevice() {
  return /android/.test(getUserAgent());
}

export function isMobileDevice() {
  const userAgent = getUserAgent();
  return isIosDevice() || isAndroidDevice() || /mobile/.test(userAgent);
}

export function isInstalledPwa() {
  if (typeof window === 'undefined') return false;

  return window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: fullscreen)').matches
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function getWebPushSupportStatus() {
  if (
    typeof window === 'undefined'
    || !('Notification' in window)
    || !('serviceWorker' in navigator)
    || !('PushManager' in window)
  ) {
    return 'unsupported' as const;
  }

  if (isIosDevice() && !isInstalledPwa()) {
    return 'ios-install-required' as const;
  }

  return 'supported' as const;
}
