// Real PWA install support for the "Install RoutineMate" button on Profile
// (docs/RoutineMate-MVP2-Scope.md §3.6). Previously that button just fired a
// fake "App installed (demo)" toast — this module captures the browser's
// actual `beforeinstallprompt` event and exposes it so ProfilePage.tsx can
// trigger the real install flow.
//
// `beforeinstallprompt` can fire at any point after the page loads and only
// once — if nothing is listening when it fires, the prompt is gone for that
// page load. So this listener is registered at module scope (side effect on
// import) rather than inside a component's `useEffect`, and is imported for
// its side effect from main.tsx as early as possible, alongside the other
// app-root bridges (AuthSessionBridge, OfflineSyncBridge).

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

type Listener = () => void;

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

if (typeof window !== 'undefined') {
  installed = window.matchMedia?.('(display-mode: standalone)').matches ?? false;

  window.addEventListener('beforeinstallprompt', (event) => {
    // Stop the browser's own mini-infobar so the user only sees our button.
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notify();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installed = true;
    notify();
  });
}

/** True once the browser has actually offered an installable prompt to capture. */
export function isInstallAvailable(): boolean {
  return deferredPrompt !== null;
}

/** True once the app is confirmed running installed (standalone display mode). */
export function isAppInstalled(): boolean {
  return installed;
}

/** Re-renders whenever install availability changes (offered, used, or the app gets installed). */
export function subscribeToInstallAvailability(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable';

/**
 * Triggers the real browser install flow. Resolves 'unavailable' if no
 * `beforeinstallprompt` has fired yet (browser doesn't support it, criteria
 * not met, or the page just hasn't been open long enough) — callers should
 * treat that as "can't install right now", not as an error.
 */
export async function promptInstall(): Promise<InstallOutcome> {
  if (!deferredPrompt) return 'unavailable';
  const promptEvent = deferredPrompt;
  await promptEvent.prompt();
  const { outcome } = await promptEvent.userChoice;
  deferredPrompt = null;
  notify();
  return outcome;
}
