import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { store } from '@app/store';
import { router } from '@app/router';
import ThemeSync from '@app/ThemeSync';
import AuthSessionBridge from '@app/AuthSessionBridge';
import OfflineSyncBridge from '@app/OfflineSyncBridge';
// Side-effect import only — registers the `beforeinstallprompt` capture as
// early as possible, since the browser only fires that event once per page
// load. See src/app/pwaInstall.ts and ProfilePage.tsx's "Install" button.
import '@app/pwaInstall';
import '@styles/global.scss';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element (#root) was not found in index.html');
}

// MVP-2 §3.6: register the app-shell service worker so the app is
// installable and the shell loads offline. Production-only — in dev, Vite's
// own HMR/module graph should stay in full control of what's served.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Non-fatal — the app still works fully online without the worker.
    });
  });
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeSync />
      <AuthSessionBridge />
      <OfflineSyncBridge />
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>,
);
