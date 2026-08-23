import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '@app/hooks';
import { selectAuthInitialized, selectIsAuthenticated } from '@features/auth/auth.selectors';

export default function ProtectedRoute({ children }: PropsWithChildren) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const initialized = useAppSelector(selectAuthInitialized);

  // The startup session check (bootstrapSessionThunk) hasn't settled yet —
  // wait rather than redirect, or a returning logged-in user gets bounced
  // to /login for one render on every page reload.
  if (!initialized) {
    return (
      <div
        role="status"
        aria-label="Loading session…"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontSize: 24,
          color: 'var(--text-secondary, #64748b)',
        }}
      >
        <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
