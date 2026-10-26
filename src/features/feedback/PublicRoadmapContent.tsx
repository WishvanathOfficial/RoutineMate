import { useCallback, useEffect, useState } from 'react';
import { extractApiErrorMessage } from '@api/apiError';
import { fetchPublicRoadmap } from './feedback.api';
import { FEEDBACK_STATUSES, formatFeedbackDate, type FeedbackItem } from './feedback.types';
import styles from './feedback.module.scss';

export function PublicRoadmapContent() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'succeeded' | 'failed'>('loading');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      setItems(await fetchPublicRoadmap());
      setStatus('succeeded');
    } catch (loadError) {
      setError(extractApiErrorMessage(loadError, 'Unable to load the public roadmap.'));
      setStatus('failed');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (status === 'loading') {
    return (
      <p className={styles.stateMessage} role="status">
        Loading roadmap…
      </p>
    );
  }
  if (status === 'failed') {
    return (
      <div className={styles.errorState} role="alert">
        <p>{error ?? 'Unable to load the public roadmap.'}</p>
        <button type="button" onClick={() => void load()}>
          Try again
        </button>
      </div>
    );
  }
  if (items.length === 0) {
    return <p className={styles.stateMessage}>No roadmap items have been published yet.</p>;
  }

  return (
    <div className={styles.ideaList}>
      {items.map((item) => (
        <article className={styles.ideaCard} key={item.id}>
          <div className={styles.voteButton} aria-label={`${item.votes} votes`}>
            <i className="fa-solid fa-caret-up" aria-hidden="true" />
            <span>{item.votes}</span>
            <small>votes</small>
          </div>
          <div className={styles.ideaContent}>
            <div className={styles.ideaTitleRow}>
              <h4>{item.title}</h4>
              <span
                className={`${styles.statusBadge} ${styles[`status_${item.status.replace('-', '_')}`]}`}
              >
                {FEEDBACK_STATUSES.find((entry) => entry.value === item.status)?.label ??
                  'Under review'}
              </span>
            </div>
            <p>{item.description}</p>
            <small>{formatFeedbackDate(item.createdAt)}</small>
          </div>
        </article>
      ))}
    </div>
  );
}
