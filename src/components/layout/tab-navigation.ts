'use client';

import { useSyncExternalStore } from 'react';

type NavigationSource = 'nav' | 'swipe' | 'route';

interface NavigateOptions {
  immediate?: boolean;
  source?: NavigationSource;
}

interface TabNavigationController {
  navigateTo: (href: string, options?: NavigateOptions) => void;
}

interface TabNavigationStore {
  activePath: string;
  controller: TabNavigationController | null;
  listeners: Set<() => void>;
}

const initialPath = typeof window !== 'undefined' ? window.location.pathname : '/';

const store: TabNavigationStore = {
  activePath: initialPath,
  controller: null,
  listeners: new Set(),
};

function emitChange() {
  store.listeners.forEach((listener) => listener());
}

export function subscribeToActiveTab(listener: () => void) {
  store.listeners.add(listener);

  return () => {
    store.listeners.delete(listener);
  };
}

export function getActiveTabPath() {
  return store.activePath;
}

export function useActiveTabPath() {
  return useSyncExternalStore(subscribeToActiveTab, getActiveTabPath, getActiveTabPath);
}

export function setActiveTabPath(nextPath: string) {
  if (!nextPath || store.activePath === nextPath) return;
  store.activePath = nextPath;
  emitChange();
}

export function syncRouteTabPath(nextPath: string) {
  if (!nextPath || store.activePath === nextPath) return;
  store.activePath = nextPath;
  emitChange();
}

export function registerTabNavigationController(controller: TabNavigationController | null) {
  store.controller = controller;
}

export function navigateToTab(nextPath: string, options?: NavigateOptions) {
  if (!nextPath || store.activePath === nextPath) return;

  store.activePath = nextPath;
  emitChange();
  store.controller?.navigateTo(nextPath, options);
}
