import type { InputHTMLAttributes } from 'react';
import styles from './Switch.module.scss';

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  'aria-label': string;
}

/**
 * Pill-style toggle switch matching the wireframe's `.switch` component —
 * a 42x24px track (muted off / brand-600 on) with a sliding white thumb.
 * Built on a real checkbox (visually hidden, still keyboard/SR accessible)
 * plus sibling track/thumb spans, rather than a plain native checkbox.
 */
export default function Switch({ className, ...rest }: SwitchProps) {
  return (
    <label className={`${styles.switch} ${className ?? ''}`}>
      <input type="checkbox" className={styles.input} {...rest} />
      <span className={styles.track}>
        <span className={styles.thumb} />
      </span>
    </label>
  );
}
