import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { selectCurrentUser } from '@features/auth/auth.selectors';
import { featureFlags } from '../../config/featureFlags';
import { toastShown } from '@features/ui/ui.slice';
import { extractApiErrorMessage } from '@api/apiError';
import styles from './challenges.module.scss';
import Modal from '@components/Modal/Modal';
import Button from '@components/Button/Button';
import {
  discoverChallenges,
  getUserChallenges,
  createChallenge,
  joinChallenge,
  leaveChallenge,
  deleteChallenge,
  type Challenge,
} from './challenges.api';

export default function ChallengesPage() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);
  const [tab, setTab] = useState<'discover' | 'mine'>('discover');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [joiningChallengeId, setJoiningChallengeId] = useState<string | null>(null);
  const [sharingChallengeId, setSharingChallengeId] = useState<string | null>(null);
  const [challengeToDelete, setChallengeToDelete] = useState<Challenge | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    emoji: '🎯',
    visibility: 'public' as 'public' | 'private',
    duration: 30,
  });
  const [saving, setSaving] = useState(false);

  // Load challenges based on current tab
  const loadChallenges = async () => {
    setLoading(true);
    try {
      const data = tab === 'discover' ? await discoverChallenges() : await getUserChallenges();
      setChallenges(data);
    } catch (err) {
      console.error('Failed to load challenges:', err);
      setChallenges([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadChallenges();
  }, [tab]);

  // Handle challenge creation
  const handleCreateChallenge = async () => {
    if (!createForm.title.trim()) return;

    setSaving(true);
    try {
      const today = new Date();
      const startDate = today.toISOString().split('T')[0];
      const endDate = new Date(today.getTime() + (createForm.duration - 1) * 86400000)
        .toISOString()
        .split('T')[0];

      await createChallenge({
        title: createForm.title.trim(),
        description: createForm.description.trim() || undefined,
        emoji: createForm.emoji,
        visibility: createForm.visibility,
        startDate,
        endDate,
      });

      setShowCreateModal(false);
      setCreateForm({
        title: '',
        description: '',
        emoji: '🎯',
        visibility: 'public',
        duration: 30,
      });
      await loadChallenges();
    } catch (err) {
      console.error('Failed to create challenge:', err);
    } finally {
      setSaving(false);
    }
  };

  // Handle joining a challenge
  const handleJoinChallenge = async (challengeId: string) => {
    setJoiningChallengeId(challengeId);
    try {
      const joinedChallenge = await joinChallenge(challengeId);
      setChallenges((current) =>
        current.map((challenge) =>
          challenge.id === challengeId
            ? { ...challenge, ...joinedChallenge, joined: true }
            : challenge,
        ),
      );
    } catch (err) {
      console.error('Failed to join challenge:', err);
    } finally {
      setJoiningChallengeId(null);
    }
  };

  // Handle leaving a challenge
  const handleLeavechallenge = async (challengeId: string) => {
    try {
      await leaveChallenge(challengeId);
      await loadChallenges();
    } catch (err) {
      console.error('Failed to leave challenge:', err);
    }
  };

  const handleDeleteChallenge = async () => {
    if (!challengeToDelete || isDeleting) return;

    setIsDeleting(true);
    try {
      await deleteChallenge(challengeToDelete.id);
      setChallenges((current) => current.filter((item) => item.id !== challengeToDelete.id));
      setChallengeToDelete(null);
      dispatch(toastShown('Challenge deleted'));
    } catch (error) {
      dispatch(toastShown(extractApiErrorMessage(error, 'Could not delete the challenge.')));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShareChallenge = async (challenge: Challenge) => {
    const shareUrl = new URL(`/challenges/${challenge.id}`, window.location.origin);
    if (challenge.visibility === 'private' && challenge.inviteToken) {
      shareUrl.searchParams.set('inviteToken', challenge.inviteToken);
    }
    const url = shareUrl.toString();
    setSharingChallengeId(challenge.id);

    try {
      if (navigator.share) {
        await navigator.share({
          title: challenge.title,
          text: `Join me in the ${challenge.title} challenge on RoutineMate.`,
          url,
        });
        dispatch(toastShown('Challenge link shared'));
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        dispatch(toastShown('Challenge link copied'));
      } else {
        const input = document.createElement('textarea');
        input.value = url;
        input.setAttribute('readonly', '');
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        const copied = document.execCommand('copy');
        document.body.removeChild(input);
        if (!copied) throw new Error('Clipboard access is unavailable');
        dispatch(toastShown('Challenge link copied'));
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      dispatch(toastShown('Could not share the challenge link'));
    } finally {
      setSharingChallengeId(null);
    }
  };

  if (!featureFlags.challenges) {
    return (
      <div className={styles.page}>
        <div className={styles.placeholder}>
          <h3>Challenges are being prepared</h3>
          <p>
            Invite friends and build routine bundles while the challenge experience is being
            finalized.
          </p>
          <a href="/routines/bundles/new">Create a routine bundle</a>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2>Challenges</h2>
          <p>Build consistency together with friends.</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <i className="fa-solid fa-plus" aria-hidden="true" /> Create Challenge
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabs}>
        <button
          className={tab === 'discover' ? styles.active : ''}
          onClick={() => setTab('discover')}
          type="button"
        >
          Discover Challenges
        </button>
        <button
          className={tab === 'mine' ? styles.active : ''}
          onClick={() => setTab('mine')}
          type="button"
        >
          My Challenges
        </button>
      </div>

      {/* Challenges Grid */}
      {loading ? (
        <div className={styles.loading}>Loading challenges...</div>
      ) : challenges.length === 0 ? (
        <div className={styles.empty}>
          <p>{tab === 'discover' ? 'No challenges available' : 'You have no challenges yet'}</p>
          {tab === 'mine' && (
            <button onClick={() => setTab('discover')} type="button">
              Discover Challenges
            </button>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {challenges.map((challenge) => (
            <article className={styles.card} key={challenge.id}>
              <Link className={styles.cardLink} to={`/challenges/${challenge.id}`}>
                <div className={styles.cardHeader}>
                  <span className={styles.emoji}>{challenge.emoji}</span>
                  <span
                    className={`${styles.badge} ${
                      challenge.status === 'archived' ? styles.archivedBadge : ''
                    }`}
                  >
                    {challenge.status === 'archived'
                      ? 'Archived'
                      : `${challenge.daysLeft} days left`}
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <h3>{challenge.title}</h3>
                  {challenge.description && (
                    <p className={styles.description}>{challenge.description}</p>
                  )}

                  <div className={styles.meta}>
                    <span className={styles.participants}>
                      <i className="fa-solid fa-users" /> {challenge.participantCount}
                    </span>
                    <span className={styles.visibility}>{challenge.visibility}</span>
                  </div>

                  {tab === 'mine' && challenge.userProgress !== undefined && (
                    <div className={styles.progress}>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{
                            width: `${Math.min(100, Math.max(0, challenge.userProgress))}%`,
                          }}
                        />
                      </div>
                      <span className={styles.progressText}>
                        {challenge.userCompletedDays ?? 0}/{challenge.userEligibleDays ?? 0} days
                        {' · '}
                        {Math.round(challenge.userProgress)}%
                      </span>
                    </div>
                  )}
                </div>
              </Link>

              <div className={styles.cardFooter}>
                {tab === 'discover' && challenge.status === 'active' ? (
                  <Button
                    onClick={() => handleJoinChallenge(challenge.id)}
                    className={challenge.joined ? styles.joined : ''}
                    disabled={challenge.joined || joiningChallengeId === challenge.id}
                  >
                    {challenge.joined
                      ? 'Joined'
                      : joiningChallengeId === challenge.id
                        ? 'Joining...'
                        : 'Join Challenge'}
                  </Button>
                ) : tab === 'mine' && challenge.status === 'active' && challenge.joined ? (
                  <Button onClick={() => handleLeavechallenge(challenge.id)} variant="secondary">
                    Leave Challenge
                  </Button>
                ) : null}
                {challenge.creatorId === currentUser?.id && (
                  <Button
                    onClick={() => setChallengeToDelete(challenge)}
                    variant="danger"
                    aria-label={`Delete ${challenge.title}`}
                    title="Delete challenge"
                  >
                    <i className="fa-solid fa-trash" aria-hidden="true" /> Delete
                  </Button>
                )}
                <Button
                  onClick={() => handleShareChallenge(challenge)}
                  variant="secondary"
                  className={styles.shareButton}
                  disabled={sharingChallengeId === challenge.id}
                  aria-label={`Share ${challenge.title}`}
                  title="Share challenge link"
                >
                  <i className="fa-solid fa-share-nodes" aria-hidden="true" />
                  {sharingChallengeId === challenge.id ? 'Sharing...' : 'Share link'}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Create Challenge Modal */}
      <Modal
        isOpen={showCreateModal}
        title="Create Challenge"
        onClose={() => {
          setShowCreateModal(false);
          setCreateForm({
            title: '',
            description: '',
            emoji: '🎯',
            visibility: 'public',
            duration: 30,
          });
        }}
      >
        <div className={styles.form}>
          <label className={styles.formGroup}>
            <span className={styles.label}>Challenge Title</span>
            <input
              type="text"
              placeholder="e.g., 30-Day Meditation Challenge"
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              required
            />
          </label>

          <label className={styles.formGroup}>
            <span className={styles.label}>Description</span>
            <textarea
              placeholder="Describe your challenge..."
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              rows={3}
            />
          </label>

          <div className={styles.formRow}>
            <label className={styles.formGroup}>
              <span className={styles.label}>Emoji</span>
              <input
                type="text"
                maxLength={2}
                value={createForm.emoji}
                onChange={(e) => setCreateForm({ ...createForm, emoji: e.target.value })}
              />
            </label>

            <label className={styles.formGroup}>
              <span className={styles.label}>Duration (days)</span>
              <input
                type="number"
                min="1"
                max="365"
                value={createForm.duration}
                onChange={(e) =>
                  setCreateForm({ ...createForm, duration: parseInt(e.target.value, 10) })
                }
              />
            </label>
          </div>

          <label className={styles.formGroup}>
            <span className={styles.label}>Visibility</span>
            <select
              value={createForm.visibility}
              onChange={(e) =>
                setCreateForm({ ...createForm, visibility: e.target.value as 'public' | 'private' })
              }
            >
              <option value="private">Private (Invite Only)</option>
              <option value="public">Public</option>
            </select>
          </label>

          <div className={styles.modalActions}>
            <Button onClick={() => setShowCreateModal(false)} disabled={saving} variant="secondary">
              Cancel
            </Button>
            <Button
              onClick={() => handleCreateChallenge()}
              disabled={!createForm.title.trim() || saving}
            >
              {saving ? 'Creating...' : 'Create Challenge'}
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={challengeToDelete !== null}
        title="Delete Challenge"
        onClose={() => {
          if (!isDeleting) setChallengeToDelete(null);
        }}
      >
        <div className={styles.deleteConfirmation}>
          <p>Are you sure you want to delete this challenge?</p>
          {challengeToDelete && <strong>{challengeToDelete.title}</strong>}
          <div className={styles.deleteConfirmationActions}>
            <button
              type="button"
              className={styles.deleteCancelButton}
              onClick={() => setChallengeToDelete(null)}
              disabled={isDeleting}
            >
              No
            </button>
            <button
              type="button"
              className={styles.deleteConfirmButton}
              onClick={() => void handleDeleteChallenge()}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting…' : 'Yes'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
