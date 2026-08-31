import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import {
  selectAllNotifications,
  selectNotificationsStatus,
  selectUnreadNotificationCount,
} from '@features/notifications/notifications.selectors';
import {
  fetchNotificationsThunk,
  markAllNotificationsReadThunk,
  snoozeNotificationThunk,
} from '@features/notifications/notifications.thunks';
import { notificationVisual } from '@features/notifications/notifications.types';
import styles from './NotificationPanel.module.scss';

export default function NotificationPanel() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectAllNotifications);
  const unreadCount = useAppSelector(selectUnreadNotificationCount);
  const status = useAppSelector(selectNotificationsStatus);
  const [isOpen, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'idle') dispatch(fetchNotificationsThunk());
  }, [status, dispatch]);

  // Close on outside click — mirrors the prototype's document click listener.
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        type="button"
        className={styles.bellButton}
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
      >
        <i className="fa-solid fa-bell" aria-hidden="true" />
        {unreadCount > 0 && <span className={styles.dot} />}
      </button>

      {isOpen && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <p>Notifications</p>
            <button
              type="button"
              className={styles.markReadButton}
              onClick={() => dispatch(markAllNotificationsReadThunk())}
            >
              Mark all read
            </button>
          </div>
          <div className={styles.list}>
            {status === 'loading' && notifications.length === 0 ? (
              <p className={styles.emptyText}>Loading…</p>
            ) : notifications.length === 0 ? (
              <p className={styles.emptyText}>You&apos;re all caught up.</p>
            ) : (
              notifications.map((notification) => {
                const visual = notificationVisual(notification.type);
                return (
                  <div className={styles.item} key={notification.id}>
                    <div className={`${styles.itemIcon} ${styles[visual.colorClass]}`}>
                      <i className={visual.icon} aria-hidden="true" />
                    </div>
                    <div className={styles.itemBody}>
                      <p
                        className={`${styles.itemMessage} ${notification.read ? styles.itemRead : ''}`}
                      >
                        {notification.message}
                      </p>
                      <p className={styles.itemTime}>{notification.timeLabel}</p>
                      {notification.snoozeable && (
                        <button
                          type="button"
                          className={styles.snoozeButton}
                          onClick={() => dispatch(snoozeNotificationThunk(notification.id))}
                        >
                          Snooze 30m
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
