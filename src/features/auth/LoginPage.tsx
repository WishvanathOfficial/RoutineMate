import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { loginUser } from './auth.thunks';
import { selectAuthError, selectAuthStatus } from './auth.selectors';
import { toastShown } from '@features/ui/ui.slice';
import logoIcon from '@assets/logo-icon.svg';
import styles from './auth.module.scss';

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const status = useAppSelector(selectAuthStatus);
  const error = useAppSelector(selectAuthError);

  // Prefilled with the backend's seeded demo account (see backend/README.md,
  // `npm run db:seed`) — was the mock's seeded user before real auth was wired up.
  const [email, setEmail] = useState('demo@routinemate.app');
  const [password, setPassword] = useState('Demo@1234');

  const isSubmitting = status === 'loading';

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

        <form className={styles.card} onSubmit={handleSubmit}>
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

          <p className={styles.footer}>
            Don&apos;t have an account? <Link to="/register">Sign up</Link>
          </p>
        </form>

        <p className={styles.backLink}>
          <Link to="/">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
