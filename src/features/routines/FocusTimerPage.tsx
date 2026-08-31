import { useEffect, useState } from 'react';
import { useAppSelector } from '@app/hooks';
import { selectActiveRoutines } from './routines.selectors';
import { httpClient } from '@api/httpClient';
import { unwrap } from '@api/apiResponse';
export default function FocusTimerPage() {
  const routines = useAppSelector(selectActiveRoutines);
  const [routineId, setRoutineId] = useState('');
  const [session, setSession] = useState<{
    id: string;
    status: string;
    durationSeconds: number;
  } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (!session || session.status !== 'running') return;
    const t = window.setInterval(() => setElapsed((v) => v + 1), 1000);
    return () => window.clearInterval(t);
  }, [session]);
  const start = async () => {
    try {
      const s = await httpClient
        .post('/api/focus-sessions', { routineId: routineId || null })
        .then(unwrap<any>);
      setSession(s);
      setElapsed(0);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to start timer.');
    }
  };
  const update = async (status: string) => {
    if (!session) return;
    const s = await httpClient
      .patch(`/api/focus-sessions/${session.id}`, { status, durationSeconds: elapsed })
      .then(unwrap<any>);
    setSession(s);
  };
  const complete = async () => {
    if (!session) return;
    await httpClient.post(`/api/focus-sessions/${session.id}/complete`, {
      durationSeconds: elapsed,
    });
    setMessage('Focus session completed.');
    setSession(null);
  };
  return (
    <div>
      <h2>Focus Timer</h2>
      <select
        aria-label="Focus routine"
        value={routineId}
        onChange={(e) => setRoutineId(e.target.value)}
      >
        <option value="">General focus</option>
        {routines.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
      <p style={{ fontSize: 40 }}>
        {Math.floor(elapsed / 60)
          .toString()
          .padStart(2, '0')}
        :{(elapsed % 60).toString().padStart(2, '0')}
      </p>
      {!session ? (
        <button type="button" onClick={() => void start()}>
          Start
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={() => void update(session.status === 'running' ? 'paused' : 'running')}
          >
            {session.status === 'running' ? 'Pause' : 'Resume'}
          </button>
          <button type="button" onClick={() => void complete()}>
            Complete
          </button>
          <button type="button" onClick={() => void update('cancelled')}>
            Cancel
          </button>
        </>
      )}
      {message && <p role="status">{message}</p>}
    </div>
  );
}
