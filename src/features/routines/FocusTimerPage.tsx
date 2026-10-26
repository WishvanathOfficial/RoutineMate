import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { extractApiErrorMessage } from '@api/apiError';
import { unwrap } from '@api/apiResponse';
import { httpClient } from '@api/httpClient';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { fetchRoutinesThunk } from './routines.thunks';
import { selectActiveRoutines, selectRoutinesStatus } from './routines.selectors';
import type { Routine } from './routines.types';
import styles from './focusTimer.module.scss';
import { useTranslation } from '../../i18n/useTranslation';

type SessionStatus = 'running' | 'paused' | 'completed' | 'cancelled';

interface FocusSession {
  id: string;
  routineId: string | null;
  status: SessionStatus;
  durationSeconds: number;
}

interface FocusSessionSummary {
  totalSeconds: number;
  sessions: Array<{
    id: string;
    routineId: string | null;
    durationSeconds: number;
    completedAt: string | null;
  }>;
}

function formatClock(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 1) return `${seconds} sec`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours > 0) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  return `${minutes} min`;
}

function formatCompletedAt(value: string | null): string {
  if (!value) return 'Recently completed';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Recently completed'
    : date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
}

export default function FocusTimerPage() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const routines = useAppSelector(selectActiveRoutines);
  const routinesStatus = useAppSelector(selectRoutinesStatus);
  const [routineId, setRoutineId] = useState('');
  const [session, setSession] = useState<FocusSession | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [summary, setSummary] = useState<FocusSessionSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (routinesStatus === 'idle') void dispatch(fetchRoutinesThunk());
  }, [dispatch, routinesStatus]);

  const loadSummary = useCallback(async () => {
    setSummaryError(null);
    try {
      const result = await httpClient
        .get('/api/focus-sessions/summary')
        .then(unwrap<FocusSessionSummary>);
      setSummary(result);
    } catch (error) {
      setSummaryError(extractApiErrorMessage(error, 'Unable to load focus history.'));
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    if (!session || session.status !== 'running') return;
    const interval = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [session]);

  const selectedRoutine = routines.find((routine) => routine.id === routineId);
  const active = session?.status === 'running' || session?.status === 'paused';
  const clock = useMemo(() => formatClock(elapsed), [elapsed]);

  const runAction = async (action: () => Promise<void>) => {
    setBusy(true);
    setActionError(null);
    setMessage('');
    try {
      await action();
    } catch (error) {
      setActionError(extractApiErrorMessage(error, 'Something went wrong. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const start = () =>
    runAction(async () => {
      const created = await httpClient
        .post('/api/focus-sessions', { routineId: routineId || null })
        .then(unwrap<FocusSession>);
      setSession(created);
      setElapsed(0);
      setMessage('');
    });

  const updateStatus = (status: 'running' | 'paused' | 'cancelled') =>
    runAction(async () => {
      if (!session) return;
      const updated = await httpClient
        .patch(`/api/focus-sessions/${session.id}`, { status, durationSeconds: elapsed })
        .then(unwrap<FocusSession>);
      if (status === 'cancelled') {
        setSession(null);
        setElapsed(0);
        setMessage('Focus session cancelled.');
      } else {
        setSession(updated);
        setMessage(status === 'paused' ? 'Session paused. Take your time.' : '');
      }
    });

  const complete = () =>
    runAction(async () => {
      if (!session) return;
      await httpClient.post(`/api/focus-sessions/${session.id}/complete`, {
        durationSeconds: elapsed,
      });
      setSession(null);
      setElapsed(0);
      setMessage('Focus session completed. Nice work!');
      await loadSummary();
    });

  const getRoutineName = (id: string | null): string => {
    if (!id) return 'General focus';
    return routines.find((routine) => routine.id === id)?.name ?? 'Routine focus';
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>MAKE SPACE FOR WHAT MATTERS</p>
          <h2>{t('Focus Timer')}</h2>
          <p>Give one routine your attention. Your session is saved to your focus history.</p>
        </div>
        <Link className={styles.backLink} to="/dashboard">
          <i className="fa-solid fa-arrow-left" aria-hidden="true" />
          Back to dashboard
        </Link>
      </header>

      <div className={styles.layout}>
        <section className={styles.timerCard} aria-label="Focus timer controls">
          <div className={styles.timerTopline}>
            <span className={`${styles.sessionBadge} ${active ? styles.sessionActive : ''}`}>
              <span className={styles.statusDot} />
              {session?.status === 'running'
                ? 'Focus in progress'
                : session?.status === 'paused'
                  ? 'Paused'
                  : 'Ready when you are'}
            </span>
            {active && (
              <span className={styles.sessionType}>{getRoutineName(session.routineId)}</span>
            )}
          </div>

          {!active && (
            <label className={styles.routineField}>
              <span>What are you focusing on?</span>
              <select
                aria-label="Focus routine"
                value={routineId}
                onChange={(event) => setRoutineId(event.target.value)}
                disabled={busy}
              >
                <option value="">General focus</option>
                {routines.map((routine: Routine) => (
                  <option key={routine.id} value={routine.id}>
                    {routine.emoji} {routine.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className={styles.timerFace}>
            <div
              className={`${styles.timerRing} ${session?.status === 'running' ? styles.timerRingRunning : ''}`}
            >
              <i className="fa-solid fa-stopwatch" aria-hidden="true" />
              <p className={styles.timerDisplay} role="timer" aria-live="off">
                {clock}
              </p>
              <span>
                {session?.status === 'paused'
                  ? 'PAUSED'
                  : session
                    ? 'ELAPSED TIME'
                    : 'READY TO FOCUS'}
              </span>
            </div>
          </div>

          {selectedRoutine && !active && (
            <p className={styles.selectedRoutine}>
              <span aria-hidden="true">{selectedRoutine.emoji}</span>
              Focus session for <strong>{selectedRoutine.name}</strong>
            </p>
          )}

          <div className={styles.actions}>
            {!session ? (
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => void start()}
                disabled={busy}
              >
                <i className="fa-solid fa-play" aria-hidden="true" />
                {busy ? 'Starting…' : 'Start focus'}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() =>
                    void updateStatus(session.status === 'running' ? 'paused' : 'running')
                  }
                  disabled={busy}
                >
                  <i
                    className={`fa-solid ${session.status === 'running' ? 'fa-pause' : 'fa-play'}`}
                    aria-hidden="true"
                  />
                  {busy ? 'Saving…' : session.status === 'running' ? 'Pause' : 'Resume'}
                </button>
                <button
                  type="button"
                  className={styles.completeButton}
                  onClick={() => void complete()}
                  disabled={busy}
                >
                  <i className="fa-solid fa-check" aria-hidden="true" />
                  Complete session
                </button>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => void updateStatus('cancelled')}
                  disabled={busy}
                >
                  Cancel
                </button>
              </>
            )}
          </div>

          {actionError && (
            <p className={styles.errorMessage} role="alert">
              {actionError}
            </p>
          )}
          {message && (
            <p className={styles.successMessage} role="status">
              {message}
            </p>
          )}
        </section>

        <aside className={styles.historyColumn}>
          <section className={styles.summaryCard} aria-labelledby="focus-summary-heading">
            <div className={styles.sectionHeading}>
              <div>
                <h3 id="focus-summary-heading">Your focus</h3>
                <p>Completed sessions, up to the latest 50.</p>
              </div>
              <i className="fa-solid fa-chart-line" aria-hidden="true" />
            </div>
            <p className={styles.totalFocus}>
              {summary ? formatDuration(summary.totalSeconds) : '—'}
            </p>
            <span className={styles.summaryCaption}>Total tracked focus time</span>
            <div className={styles.sessionCount}>
              <i className="fa-solid fa-bullseye" aria-hidden="true" />
              <span>{summary ? summary.sessions.length : '—'} completed sessions</span>
            </div>
            {summaryError && (
              <div className={styles.summaryError} role="alert">
                <span>{summaryError}</span>
                <button type="button" onClick={() => void loadSummary()}>
                  Retry
                </button>
              </div>
            )}
          </section>

          <section className={styles.historyCard} aria-labelledby="recent-sessions-heading">
            <div className={styles.sectionHeading}>
              <div>
                <h3 id="recent-sessions-heading">Recent sessions</h3>
                <p>A little progress adds up.</p>
              </div>
            </div>
            {!summary && !summaryError ? (
              <p className={styles.historyState} role="status">
                Loading focus history…
              </p>
            ) : summary?.sessions.length ? (
              <ul className={styles.sessionList}>
                {summary.sessions.slice(0, 5).map((item) => (
                  <li key={item.id} className={styles.sessionRow}>
                    <span className={styles.sessionIcon}>
                      <i className="fa-solid fa-check" aria-hidden="true" />
                    </span>
                    <span className={styles.sessionDetails}>
                      <strong>{getRoutineName(item.routineId)}</strong>
                      <small>{formatCompletedAt(item.completedAt)}</small>
                    </span>
                    <span className={styles.sessionDuration}>
                      {formatDuration(item.durationSeconds)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.historyState}>
                <i className="fa-regular fa-clock" aria-hidden="true" />
                <p>Your completed focus sessions will show up here.</p>
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
