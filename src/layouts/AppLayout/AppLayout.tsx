import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '@components/Sidebar/Sidebar';
import Topbar from '@components/Topbar/Topbar';
import Toast from '@components/Toast/Toast';
import styles from './AppLayout.module.scss';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/routines': 'Routines',
  '/stats': 'Stats & Insights',
  '/calendar': 'Calendar',
  '/profile': 'Profile & Settings',
  '/friends': 'Friends',
  '/challenges': 'Challenges',
  '/focus-timer': 'Focus Timer',
  '/feedback': 'Feedback',
  '/settings/language': 'Language Settings',
  '/routines/bundles/new': 'Routine Bundle',
};

function resolveTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith('/routines/')) return 'Routine Detail';
  return 'RoutineMate';
}

export default function AppLayout() {
  const location = useLocation();
  const title = resolveTitle(location.pathname);

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <Topbar title={title} />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
      <Toast />
    </div>
  );
}
