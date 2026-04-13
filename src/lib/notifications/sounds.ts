'use client';

import { NOTIFICATION_SOUND_PATHS } from '@/lib/notifications/constants';
import type { NotificationType } from '@/lib/notifications/types';

let audioUnlocked = false;
let unlockListenersAttached = false;
let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;

  const AudioContextConstructor = window.AudioContext || (window as typeof window & {
    webkitAudioContext?: typeof AudioContext;
  }).webkitAudioContext;

  if (!AudioContextConstructor) return null;

  if (!audioContext) {
    audioContext = new AudioContextConstructor();
  }

  return audioContext;
}

function getFallbackTone(type: NotificationType | 'default') {
  switch (type) {
    case 'bad':
      return { frequency: 196, duration: 0.18 };
    case 'warning':
      return { frequency: 320, duration: 0.14 };
    case 'class':
      return { frequency: 440, duration: 0.12 };
    case 'broadcast':
    case 'good':
    case 'system':
    case 'default':
    default:
      return { frequency: 520, duration: 0.12 };
  }
}

function detachUnlockListeners() {
  if (typeof window === 'undefined' || !unlockListenersAttached) return;

  window.removeEventListener('pointerdown', unlockNotificationAudio);
  window.removeEventListener('keydown', unlockNotificationAudio);
  window.removeEventListener('touchstart', unlockNotificationAudio);
  unlockListenersAttached = false;
}

export function unlockNotificationAudio() {
  audioUnlocked = true;
  detachUnlockListeners();

  const context = getAudioContext();
  if (context?.state === 'suspended') {
    void context.resume().catch(() => undefined);
  }
}

export function primeNotificationAudio() {
  if (typeof window === 'undefined' || unlockListenersAttached || audioUnlocked) return;

  window.addEventListener('pointerdown', unlockNotificationAudio, { once: true, passive: true });
  window.addEventListener('keydown', unlockNotificationAudio, { once: true });
  window.addEventListener('touchstart', unlockNotificationAudio, { once: true, passive: true });
  unlockListenersAttached = true;
}

function playFallbackTone(type: NotificationType | 'default') {
  const context = getAudioContext();
  if (!context || !audioUnlocked) return;

  const { frequency, duration } = getFallbackTone(type);
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = 'triangle';
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}

export async function playNotificationSound(type: NotificationType | 'default') {
  if (typeof window === 'undefined' || !audioUnlocked) return;

  const src = NOTIFICATION_SOUND_PATHS[type] ?? NOTIFICATION_SOUND_PATHS.default;
  const audio = new Audio(src);
  audio.preload = 'auto';
  audio.volume = type === 'bad' ? 0.84 : 0.72;

  try {
    await audio.play();
  } catch {
    playFallbackTone(type);
  }
}
