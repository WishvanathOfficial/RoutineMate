import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { selectToasts } from '@features/ui/ui.selectors';
import { toastDismissed } from '@features/ui/ui.slice';
import styles from './Toast.module.scss';

const AUTO_DISMISS_MS = 2500;

export default function Toast() {
  const toasts = useAppSelector(selectToasts);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (toasts.length === 0) return;
    const oldest = toasts[0];
    const timer = setTimeout(() => dispatch(toastDismissed(oldest.id)), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toasts, dispatch]);

  if (toasts.length === 0) return null;

  return (
    <div className={styles.container} role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={styles.toast}>
          {toast.text}
        </div>
      ))}
    </div>
  );
}
