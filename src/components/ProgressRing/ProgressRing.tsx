import styles from './ProgressRing.module.scss';

interface ProgressRingProps {
  percentage: number;
}

export default function ProgressRing({ percentage }: ProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, percentage));
  // Uses the --ring-fill / --ring-track custom properties defined in
  // global.scss so the ring automatically follows the light/dark theme
  // instead of being locked to hardcoded light-mode hex values.
  const background = `conic-gradient(var(--ring-fill) ${clamped * 3.6}deg, var(--ring-track) 0deg)`;

  return (
    <div className={styles.ring} style={{ background }}>
      <div className={styles.inner}>
        <strong>{clamped}%</strong>
        <span>complete</span>
      </div>
    </div>
  );
}
