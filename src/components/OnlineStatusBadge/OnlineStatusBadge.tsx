import { useEffect, useState } from 'react';
import styles from './OnlineStatusBadge.module.scss';

// MVP-2 §3.6: PWA/offline support — a small always-visible signal for
// whether the app is currently talking to the network, so users understand
// why check-ins might not be syncing. Real online/offline events, not a
// simulated toggle.
export default function OnlineStatusBadge() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <span className={`${styles.badge} ${isOnline ? styles.online : styles.offline}`}>
      <i className={isOnline ? 'fa-solid fa-wifi' : 'fa-solid fa-wifi-slash'} aria-hidden="true" />
      {isOnline ? 'Online' : 'Offline'}
    </span>
  );
}
