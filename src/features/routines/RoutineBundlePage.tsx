import { useState } from 'react';
import { useAppSelector } from '@app/hooks';
import { selectAllRoutines } from './routines.selectors';
import { httpClient } from '@api/httpClient';
export default function RoutineBundlePage() {
  const routines = useAppSelector(selectAllRoutines);
  const [title, setTitle] = useState('Morning Routine');
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const save = async () => {
    if (selected.length < 2) {
      setMessage('Select at least two routines.');
      return;
    }
    try {
      await httpClient.post('/api/routine-bundles', { title, routineIds: selected });
      setMessage('Routine bundle created.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to create bundle.');
    }
  };
  return (
    <div>
      <h2>Create Routine Bundle</h2>
      <label htmlFor="bundle-title">Name</label>
      <input id="bundle-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <p>Select routines in completion order:</p>
      {routines
        .filter((r) => r.status === 'active')
        .map((r) => (
          <label key={r.id} style={{ display: 'block' }}>
            <input
              type="checkbox"
              checked={selected.includes(r.id)}
              onChange={() =>
                setSelected((v) => (v.includes(r.id) ? v.filter((x) => x !== r.id) : [...v, r.id]))
              }
            />{' '}
            {r.emoji} {r.name}
          </label>
        ))}
      <button type="button" onClick={() => void save()}>
        Create bundle
      </button>
      {message && <p role="status">{message}</p>}
    </div>
  );
}
