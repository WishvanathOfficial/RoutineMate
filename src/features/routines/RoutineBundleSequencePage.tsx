import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { checkInBundle, fetchBundle, type RoutineBundle } from './bundles.api';
import styles from './routineBundleSequence.module.scss';
export default function RoutineBundleSequencePage() {
  const { id } = useParams();
  const [bundle, setBundle] = useState<RoutineBundle | null>(null);
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (id)
      void fetchBundle(id)
        .then(setBundle)
        .catch(() => setMessage('Unable to load this bundle.'));
  }, [id]);
  if (!bundle) return <div className={styles.loading}>{message || 'Loading sequence…'}</div>;
  const active = bundle.items.filter((i) => i.routine);
  const current = active[step];
  const finish = async () => {
    if (!id) return;
    try {
      const result = await checkInBundle(id, step === active.length - 1);
      setBundle(result.bundle);
      if (step < active.length - 1) setStep(step + 1);
      else setMessage('Bundle completed — streak updated!');
    } catch {
      setMessage('Unable to save this step. Please retry.');
    }
  };
  return (
    <div className={styles.page}>
      <Link className={styles.back} to="/routines">
        ← Back to routines
      </Link>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>GUIDED SEQUENCE</p>
          <h2>{bundle.title}</h2>
        </div>
        <span className={styles.streak}>🔥 {bundle.streak} day streak</span>
      </div>
      <div className={styles.progress}>
        <span>
          Step {Math.min(step + 1, active.length)} of {active.length}
        </span>
        <div>
          <i style={{ width: `${((step + 1) / Math.max(active.length, 1)) * 100}%` }} />
        </div>
      </div>
      {current && (
        <div className={styles.stepCard}>
          <p className={styles.emoji}>{current.routine?.emoji}</p>
          <h3>{current.routine?.name}</h3>
          <p className={styles.prompt}>Complete this routine, then continue to the next step.</p>
          <div className={styles.actions}>
            <button className={styles.primary} type="button" onClick={() => void finish()}>
              {step === active.length - 1 ? 'Complete bundle' : 'Complete step'}
            </button>
            <button
              className={styles.secondary}
              type="button"
              disabled={step >= active.length - 1}
              onClick={() => setStep(step + 1)}
            >
              Skip
            </button>
          </div>
        </div>
      )}
      {message && (
        <p className={styles.message} role="status">
          {message}
        </p>
      )}
    </div>
  );
}
