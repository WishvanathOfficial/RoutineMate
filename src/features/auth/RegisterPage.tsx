import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { loginWithGoogle, registerUser } from './auth.thunks';
import { selectAuthError, selectAuthStatus } from './auth.selectors';
import logoIcon from '@assets/logo-icon.svg';
import styles from './auth.module.scss';

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const status = useAppSelector(selectAuthStatus);
  const error = useAppSelector(selectAuthError);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? '';
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const isSubmitting = status === 'loading';

  useEffect(() => {
    if (!googleClientId) return;
    const initialize = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          if (!response.credential) return;
          const result = await dispatch(loginWithGoogle({ credential: response.credential }));
          if (loginWithGoogle.fulfilled.match(result)) navigate('/onboarding');
        },
      });
      googleButtonRef.current.replaceChildren();
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: 'continue_with',
      });
    };
    const existing = document.getElementById('google-gsi');
    if (existing) {
      if (window.google?.accounts?.id) initialize();
      else existing.addEventListener('load', initialize, { once: true });
    } else {
      const script = document.createElement('script');
      script.id = 'google-gsi';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initialize;
      document.head.appendChild(script);
    }
  }, [dispatch, googleClientId, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await dispatch(registerUser({ name, email, password }));
    if (registerUser.fulfilled.match(result)) {
      // MVP-2: new accounts go through the onboarding wizard once, right
      // after registration, instead of landing straight on an empty
      // dashboard — see docs/RoutineMate-MVP2-Scope.md §3.4.
      navigate('/onboarding');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <img src={logoIcon} alt="RoutineMate" />
          <h1>Create your account</h1>
          <p>Start building better routines today.</p>
        </div>

        <form className={styles.card} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              type="text"
              required
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              placeholder="jane@example.com"
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
              minLength={8}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className={styles.submit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Create Account'}
          </button>

          <div className={styles.divider}>
            <span>or</span>
          </div>
          {googleClientId ? (
            <div ref={googleButtonRef} aria-label="Continue with Google" />
          ) : (
            <button type="button" className={styles.googleButton} disabled>
              Continue with Google
            </button>
          )}

          <p className={styles.footer}>
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>

        <p className={styles.backLink}>
          <Link to="/">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
