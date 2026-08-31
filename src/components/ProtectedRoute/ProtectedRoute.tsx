import { useEffect, type PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { selectAuthInitialized, selectIsAuthenticated } from '@features/auth/auth.selectors';
import {
  selectOnboardingCompleted,
  selectOnboardingStatus,
} from '@features/onboarding/onboarding.selectors';
import { fetchOnboardingStateThunk } from '@features/onboarding/onboarding.thunks';

interface ProtectedRouteProps extends PropsWithChildren {
  /**
   * Set only on the /onboarding route itself. Skips the "onboarding must
   * already be complete" requirement every other protected route enforces,
   * and instead sends an already-onboarded user straight to /dashboard so
   * they can't revisit the wizard — docs/RoutineMate-MVP2-Scope.md §3.4
   * "Triggered once, immediately after registration".
   */
  onboardingRoute?: boolean;
}

function LoadingScreen() {
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

export default function ProtectedRoute({ children, onboardingRoute = false }: ProtectedRouteProps) {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const initialized = useAppSelector(selectAuthInitialized);
  const onboardingCompleted = useAppSelector(selectOnboardingCompleted);
  const onboardingStatus = useAppSelector(selectOnboardingStatus);

  // One-time per authenticated session — see onboarding.api.ts's
  // fetchOnboardingState(). Runs regardless of which protected route was
  // hit first, so the enforcement below works the same whether the user
  // logged in, refreshed an existing session, or typed a URL directly.
  useEffect(() => {
    if (isAuthenticated && onboardingStatus === 'idle') {
      dispatch(fetchOnboardingStateThunk());
    }
  }, [isAuthenticated, onboardingStatus, dispatch]);

  // The startup session check (bootstrapSessionThunk) hasn't settled yet —
  // wait rather than redirect, or a returning logged-in user gets bounced
  // to /login for one render on every page reload. Once authenticated, wait
  // the same way for the onboarding-state check above to resolve, so a
  // returning user isn't briefly bounced to/from /onboarding before it does.
  const onboardingPending =
    isAuthenticated && (onboardingStatus === 'idle' || onboardingStatus === 'loading');
  if (!initialized || onboardingPending) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // `onboardingStatus === 'failed'` fails open (treated as already
  // onboarded) rather than trapping the user behind a permanent redirect
  // loop over what's likely a transient network error.
  if (!onboardingRoute && onboardingStatus === 'succeeded' && !onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }
  if (onboardingRoute && onboardingCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
