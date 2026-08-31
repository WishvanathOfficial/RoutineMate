import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { loginUser, loginWithGoogle } from './auth.thunks';
import { selectAuthError, selectAuthStatus } from './auth.selectors';
import { toastShown } from '@features/ui/ui.slice';
import logoIcon from '@assets/logo-icon.svg';
import styles from './auth.module.scss';

type GoogleCredentialResponse = {
  credential?: string;
};

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const status = useAppSelector(selectAuthStatus);
  const error = useAppSelector(selectAuthError);

  // Prefilled with the backend's seeded demo account (see backend/README.md,
  // `npm run db:seed`) — was the mock's seeded user before real auth was wired up.
  const [email, setEmail] = useState('demo@routinemate.app');
  const [password, setPassword] = useState('Demo@1234');
  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? '';
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const isSubmitting = status === 'loading';

  useEffect(() => {
    if (!googleClientId || typeof window === 'undefined') return;

    const scriptId = 'google-gsi';
    const existing = document.getElementById(scriptId);

    const initializeGoogle = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: GoogleCredentialResponse) => {
          const credential = response.credential;
          if (!credential) {
            dispatch(toastShown('Google sign-in did not return a valid credential.'));
            return;
          }

          const result = await dispatch(loginWithGoogle({ credential }));
          if (loginWithGoogle.fulfilled.match(result)) {
            dispatch(toastShown(`Welcome back, ${result.payload.user.name.split(' ')[0]}!`));
            navigate('/dashboard');
          }
        },
      });
      if (googleButtonRef.current) {
        googleButtonRef.current.replaceChildren();
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'continue_with',
        });
      }
    };

    if (existing) {
      if (window.google?.accounts?.id) initializeGoogle();
      else existing.addEventListener('load', initializeGoogle, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    document.head.appendChild(script);

    return () => {
      const el = document.getElementById(scriptId);
      if (el) el.remove();
    };
  }, [dispatch, googleClientId, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(result)) {
      dispatch(toastShown(`Welcome back, ${result.payload.user.name.split(' ')[0]}!`));
      navigate('/dashboard');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <img src={logoIcon} alt="RoutineMate" />
          <h1>Welcome back</h1>
          <p>Log in to continue your streaks.</p>
        </div>

        <div className={styles.card}>
          {googleClientId ? (
            <div ref={googleButtonRef} aria-label="Continue with Google" />
          ) : (
            <button type="button" className={styles.googleButton} disabled>
              Continue with Google
            </button>
          )}

          <div className={styles.divider}>
            <span>or</span>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className={styles.submit} disabled={isSubmitting}>
              {isSubmitting ? 'Logging in…' : 'Log In'}
            </button>
          </form>

          <p className={styles.footer}>
            Don&apos;t have an account? <Link to="/register">Sign up</Link>
          </p>
        </div>

        <p className={styles.backLink}>
          <Link to="/">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
