import { useEffect } from 'react';
import { useAppSelector } from './hooks';
import { selectTheme } from '@features/ui/ui.selectors';

const THEME_STORAGE_KEY = 'routinemate-theme';

/**
 * Applies the current theme to <html> and persists it, regardless of which
 * route is active. Mounted once at the app root (see main.tsx) so the
 * toggle in the Topbar affects the whole app — including public pages like
 * the landing/login/register screens that sit outside AppLayout.
 */
export default function ThemeSync() {
  const theme = useAppSelector(selectTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  return null;
}
