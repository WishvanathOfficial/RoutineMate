import { NavLink } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { selectSidebarCollapsed } from '@features/ui/ui.selectors';
import { sidebarToggled } from '@features/ui/ui.slice';
import { logoutUser } from '@features/auth/auth.thunks';
import logoIcon from '@assets/logo-icon.svg';
import styles from './Sidebar.module.scss';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

// Matches the MVP3 wireframe: social navigation is grouped in the main menu,
// while Feedback stays in the sidebar footer with utility actions.
const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: 'fa-solid fa-gauge-high' },
  { to: '/routines', label: 'Routines', icon: 'fa-solid fa-list-check' },
  { to: '/goals', label: 'Goals', icon: 'fa-solid fa-bullseye' },
  { to: '/challenges', label: 'Challenges', icon: 'fa-solid fa-people-group' },
  { to: '/friends', label: 'Friends', icon: 'fa-solid fa-user-group' },
  { to: '/stats', label: 'Stats', icon: 'fa-solid fa-chart-simple' },
  { to: '/achievements', label: 'Achievements', icon: 'fa-solid fa-trophy' },
  { to: '/journal', label: 'Journal', icon: 'fa-solid fa-book-open' },
  { to: '/calendar', label: 'Calendar', icon: 'fa-solid fa-calendar-days' },
  { to: '/profile', label: 'Profile & Settings', icon: 'fa-solid fa-user-gear' },
];

export default function Sidebar() {
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector(selectSidebarCollapsed);

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.logo}>
        <img src={logoIcon} alt="RoutineMate" />
        <span className={`${styles.logoText} gradient-text`}>RoutineMate</span>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
          >
            <span className={styles.icon}>
              <i className={item.icon} aria-hidden="true" />
            </span>
            <span className={styles.label}>{item.label}</span>
            <span className={styles.tooltip}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        <NavLink to="/feedback" className={styles.footerLink}>
          <span className={styles.icon}>
            <i className="fa-solid fa-comment-dots" aria-hidden="true" />
          </span>
          <span className={styles.label}>Feedback</span>
          <span className={styles.tooltip}>Feedback</span>
        </NavLink>
        <button
          type="button"
          className={styles.collapseButton}
          onClick={() => dispatch(sidebarToggled())}
        >
          <span className={styles.icon}>
            <i
              className={collapsed ? 'fa-solid fa-angles-right' : 'fa-solid fa-angles-left'}
              aria-hidden="true"
            />
          </span>
          <span className={styles.label}>Collapse</span>
          <span className={styles.tooltip}>{collapsed ? 'Expand' : 'Collapse'}</span>
        </button>
        <NavLink to="/" onClick={() => dispatch(logoutUser())} className={styles.logoutLink}>
          <span className={styles.icon}>
            <i className="fa-solid fa-arrow-right-from-bracket" aria-hidden="true" />
          </span>
          <span className={styles.label}>Log Out</span>
          <span className={styles.tooltip}>Log Out</span>
        </NavLink>
      </div>
    </aside>
  );
}
