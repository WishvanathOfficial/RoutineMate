import { useEffect } from 'react';
import { SESSION_EXPIRED_EVENT } from '@api/httpClient';
import { bootstrapSessionThunk } from '@features/auth/auth.thunks';
import { sessionExpired } from '@features/auth/auth.slice';
import { useAppDispatch } from './hooks';

/**
 * Mounted once at the app root (see main.tsx), alongside ThemeSync.
 *
 * Two jobs:
 * 1. On mount, tries to resume a session via the httpOnly refresh cookie
 *    (bootstrapSessionThunk) so a page reload doesn't silently log the user
 *    out — ProtectedRoute waits on `initialized` before deciding to redirect.
 * 2. Listens for SESSION_EXPIRED_EVENT, dispatched by httpClient's response
 *    interceptor when a silent refresh fails irrecoverably, and clears auth
 *    state so the UI reflects the logout immediately.
 *
 * httpClient can't dispatch directly — importing the store there would
 * create a circular import (store -> auth.slice -> auth.thunks -> auth.api
 * -> httpClient -> store). A DOM event keeps the two decoupled.
 */
export default function AuthSessionBridge() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(bootstrapSessionThunk());
  }, [dispatch]);

  useEffect(() => {
    const handleSessionExpired = () => dispatch(sessionExpired());
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, [dispatch]);

  return null;
}
