import { useAppDispatch, useAppSelector } from '@app/hooks';
import { selectTheme } from '@features/ui/ui.selectors';
import { themeToggled } from '@features/ui/ui.slice';
import { selectCurrentUser } from '@features/auth/auth.selectors';
import styles from './Topbar.module.scss';

interface TopbarProps {
  title: string;
}

export default function Topbar({ title }: TopbarProps) {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);
  const user = useAppSelector(selectCurrentUser);

  const initials = user?.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className={styles.topbar}>
      <p className={styles.title}>{title}</p>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.iconButton}
          aria-label="Toggle theme"
          onClick={() => dispatch(themeToggled())}
        >
          <i
            className={theme === 'light' ? 'fa-solid fa-moon' : 'fa-solid fa-sun'}
            aria-hidden="true"
          />
        </button>
        <button type="button" className={styles.iconButton} aria-label="Notifications">
          <i className="fa-solid fa-bell" aria-hidden="true" />
        </button>
        <div className={`${styles.avatar} gradient-bg`}>{initials ?? 'JD'}</div>
      </div>
    </header>
  );
}
