import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { extractApiErrorMessage } from '@api/apiError';
import { createFeedback, fetchFeedback, setFeedbackVote } from './feedback.api';
import {
  FEEDBACK_STATUSES,
  formatFeedbackDate,
  type FeedbackItem,
  type FeedbackStatusFilter,
} from './feedback.types';
import { PublicRoadmapContent } from './PublicRoadmapContent';
import styles from './feedback.module.scss';

export default function FeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FeedbackStatusFilter>('all');
  const [sortBy, setSortBy] = useState<'top' | 'newest'>('top');
  const [loadStatus, setLoadStatus] = useState<'loading' | 'succeeded' | 'failed'>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [votingIds, setVotingIds] = useState<string[]>([]);
  const [roadmapOpen, setRoadmapOpen] = useState(false);
  const roadmapTriggerRef = useRef<HTMLButtonElement>(null);
  const roadmapCloseRef = useRef<HTMLButtonElement>(null);

  const load = useCallback(async (filter: FeedbackStatusFilter) => {
    setLoadStatus('loading');
    setLoadError(null);
    try {
      setItems(await fetchFeedback(filter));
      setLoadStatus('succeeded');
    } catch (error) {
      setLoadError(extractApiErrorMessage(error, 'Unable to load feedback.'));
      setLoadStatus('failed');
    }
  }, []);

  useEffect(() => {
    void load(statusFilter);
  }, [load, statusFilter]);

  useEffect(() => {
    if (!roadmapOpen) return;
    roadmapCloseRef.current?.focus();
    const trigger = roadmapTriggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setRoadmapOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      trigger?.focus();
    };
  }, [roadmapOpen]);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return [...items]
      .filter(
        (item) =>
          !query ||
          item.title.toLocaleLowerCase().includes(query) ||
          item.description.toLocaleLowerCase().includes(query),
      )
      .sort((a, b) =>
        sortBy === 'top'
          ? b.votes - a.votes || b.createdAt.localeCompare(a.createdAt)
          : b.createdAt.localeCompare(a.createdAt),
      );
  }, [items, search, sortBy]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    if (!cleanTitle || !cleanDescription) {
      setActionError('Add a title and a short description so others can understand your idea.');
      return;
    }
    setSubmitting(true);
    setActionError(null);
    try {
      const created = await createFeedback({ title: cleanTitle, description: cleanDescription });
      setItems((current) => [created, ...current.filter((item) => item.id !== created.id)]);
      setTitle('');
      setDescription('');
      if (statusFilter !== 'all' && statusFilter !== 'planned') setStatusFilter('planned');
    } catch (error) {
      setActionError(extractApiErrorMessage(error, 'Unable to submit this idea.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (item: FeedbackItem) => {
    setVotingIds((current) => [...current, item.id]);
    setActionError(null);
    try {
      const updated = await setFeedbackVote(item.id, item.hasVoted);
      setItems((current) =>
        current.map((candidate) => (candidate.id === item.id ? updated : candidate)),
      );
    } catch (error) {
      setActionError(extractApiErrorMessage(error, 'Unable to update your vote. Please retry.'));
    } finally {
      setVotingIds((current) => current.filter((id) => id !== item.id));
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h2>Feedback &amp; Roadmap</h2>
          <p>Share ideas, help prioritize what matters, and follow progress.</p>
        </div>
        <button
          ref={roadmapTriggerRef}
          type="button"
          className={styles.roadmapLink}
          onClick={() => setRoadmapOpen(true)}
        >
          View public roadmap{' '}
          <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
        </button>
      </header>

      <form className={styles.formCard} onSubmit={(event) => void handleSubmit(event)}>
        <div>
          <h3>Suggest an idea</h3>
          <p>Search first to see whether someone has already suggested it.</p>
        </div>
        <label className={styles.field}>
          <span>Title</span>
          <input
            aria-label="Title"
            value={title}
            minLength={3}
            maxLength={160}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What would make RoutineMate better?"
            required
          />
          <small>{title.length}/160</small>
        </label>
        <label className={styles.field}>
          <span>Why would this help?</span>
          <textarea
            aria-label="Why would this help?"
            value={description}
            minLength={5}
            maxLength={2000}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe the problem this idea would solve."
            rows={3}
            required
          />
          <small>{description.length}/2000</small>
        </label>
        <div className={styles.formFooter}>
          <p>Ideas are visible to the RoutineMate community.</p>
          <button type="submit" className={styles.primaryButton} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit idea'}
          </button>
        </div>
      </form>

      {actionError && (
        <p className={styles.actionError} role="alert">
          {actionError}
        </p>
      )}

      <section className={styles.listSection} aria-labelledby="feedback-list-heading">
        <div className={styles.listHeader}>
          <div>
            <h3 id="feedback-list-heading">Community ideas</h3>
            <p>Vote once for ideas you want the team to prioritize.</p>
          </div>
          <div className={styles.controls}>
            <label>
              <span className={styles.visuallyHidden}>Filter by status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as FeedbackStatusFilter)}
              >
                <option value="all">All statuses</option>
                {FEEDBACK_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className={styles.visuallyHidden}>Sort ideas</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as 'top' | 'newest')}
              >
                <option value="top">Most votes</option>
                <option value="newest">Newest</option>
              </select>
            </label>
          </div>
        </div>

        <label className={styles.searchField}>
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <span className={styles.visuallyHidden}>Search ideas</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search existing ideas"
          />
        </label>

        {loadStatus === 'loading' ? (
          <p className={styles.stateMessage} role="status">
            Loading ideas…
          </p>
        ) : loadStatus === 'failed' ? (
          <div className={styles.errorState} role="alert">
            <p>{loadError ?? 'Unable to load feedback.'}</p>
            <button type="button" onClick={() => void load(statusFilter)}>
              Try again
            </button>
          </div>
        ) : visibleItems.length === 0 ? (
          <p className={styles.stateMessage}>
            {search.trim()
              ? 'No ideas match your search. Try another phrase or submit a new idea.'
              : 'No ideas here yet. Be the first to share one.'}
          </p>
        ) : (
          <div className={styles.ideaList}>
            {visibleItems.map((item) => (
              <article className={styles.ideaCard} key={item.id}>
                <button
                  type="button"
                  className={`${styles.voteButton} ${item.hasVoted ? styles.voteButtonActive : ''}`}
                  onClick={() => void handleVote(item)}
                  disabled={votingIds.includes(item.id)}
                  aria-pressed={item.hasVoted}
                  aria-label={`${item.hasVoted ? 'Remove vote from' : 'Vote for'} ${item.title}. ${item.votes} votes`}
                >
                  <i className="fa-solid fa-caret-up" aria-hidden="true" />
                  <span>{item.votes}</span>
                  <small>{item.hasVoted ? 'Voted' : 'Vote'}</small>
                </button>
                <div className={styles.ideaContent}>
                  <div className={styles.ideaTitleRow}>
                    <h4>{item.title}</h4>
                    <span
                      className={`${styles.statusBadge} ${styles[`status_${item.status.replace('-', '_')}`]}`}
                    >
                      {FEEDBACK_STATUSES.find((status) => status.value === item.status)?.label ??
                        'Under review'}
                    </span>
                  </div>
                  <p>{item.description}</p>
                  <small>{formatFeedbackDate(item.createdAt)}</small>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {roadmapOpen && (
        <div className={styles.modalBackdrop}>
          <section
            className={styles.roadmapModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="public-roadmap-title"
          >
            <header className={styles.modalHeader}>
              <div>
                <h2 id="public-roadmap-title">Public Roadmap</h2>
                <p>See what the community is asking for and what the team is working on.</p>
              </div>
              <button
                ref={roadmapCloseRef}
                type="button"
                className={styles.modalCloseButton}
                onClick={() => setRoadmapOpen(false)}
                aria-label="Close public roadmap"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </header>
            <div className={styles.modalContent}>
              <PublicRoadmapContent />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
