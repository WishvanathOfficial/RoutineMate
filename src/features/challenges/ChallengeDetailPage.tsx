import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '@app/hooks';
import { toastShown } from '@features/ui/ui.slice';
import { extractApiErrorMessage } from '@api/apiError';
import styles from './challengeDetail.module.scss';
import Button from '@components/Button/Button';
import {
  getChallengeDetail,
  joinChallenge,
  leaveChallenge,
  submitCheckIn,
  addReaction,
  getChallengeLeaderboard,
  type ChallengeDetail,
} from './challenges.api';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  avatar?: string;
  progress: number;
  streak: number;
}

export default function ChallengeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('inviteToken') ?? undefined;
  const dispatch = useAppDispatch();
  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkInCompleted, setCheckInCompleted] = useState(true);
  const [checkInNotes, setCheckInNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [joining, setJoining] = useState(false);

  const loadChallenge = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const [challengeData, leaderboardData] = await Promise.all([
        getChallengeDetail(id, inviteToken),
        getChallengeLeaderboard(id),
      ]);

      setChallenge(challengeData);
      setLeaderboard(leaderboardData as LeaderboardEntry[]);
    } catch (err) {
      console.error('Failed to load challenge:', err);
      navigate('/challenges');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadChallenge();
  }, [id, inviteToken]);

  const handleJoinChallenge = async () => {
    if (!id || joining) return;
    setJoining(true);
    try {
      await joinChallenge(id, inviteToken);
      dispatch(toastShown('You joined the challenge'));
      await loadChallenge();
    } catch (error) {
      dispatch(toastShown(extractApiErrorMessage(error, 'Could not join the challenge.')));
    } finally {
      setJoining(false);
    }
  };

  const handleSubmitCheckIn = async () => {
    if (!id) return;

    setSubmitting(true);
    try {
      await submitCheckIn(id, checkInDate, checkInCompleted, checkInNotes);
      setCheckInDate(new Date().toISOString().split('T')[0]);
      setCheckInCompleted(true);
      setCheckInNotes('');
      await loadChallenge();
    } catch (err) {
      console.error('Failed to submit check-in:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddReaction = async (checkInId: string, emoji: string) => {
    if (!id) return;

    try {
      await addReaction(id, checkInId, emoji);
      await loadChallenge();
    } catch (err) {
      console.error('Failed to add reaction:', err);
    }
  };

  const handleLeavechallenge = async () => {
    if (!id || !window.confirm('Are you sure you want to leave this challenge?')) return;

    try {
      await leaveChallenge(id);
      navigate('/challenges');
    } catch (err) {
      console.error('Failed to leave challenge:', err);
    }
  };

  if (loading) {
    return <div className={styles.page}>Loading challenge...</div>;
  }

  if (!challenge) {
    return <div className={styles.page}>Challenge not found</div>;
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/challenges')} type="button">
          <i className="fa-solid fa-chevron-left" /> Back
        </button>

        <div className={styles.title}>
          <span className={styles.emoji}>{challenge.emoji}</span>
          <div>
            <h1>{challenge.title}</h1>
            <p>{challenge.description}</p>
          </div>
        </div>

        <div className={styles.status}>
          <span
            className={`${styles.badge} ${
              challenge.status === 'archived' ? styles.archivedBadge : ''
            }`}
          >
            {challenge.status === 'archived' ? 'Archived' : `${challenge.daysLeft} days left`}
          </span>
          <span className={styles.badge}>
            {challenge.participantCount}{' '}
            {challenge.participantCount === 1 ? 'participant' : 'participants'}
          </span>
          {!challenge.joined && challenge.status === 'active' && (
            <Button onClick={handleJoinChallenge} disabled={joining}>
              {joining ? 'Joining...' : 'Join Challenge'}
            </Button>
          )}
        </div>
      </div>

      <div className={styles.container}>
        {/* Shared Progress Feed */}
        <div className={styles.main}>
          <h2 className={styles.sectionTitle}>Shared Progress</h2>

          {challenge.feed.length === 0 ? (
            <div className={styles.empty}>No progress yet. Be the first to check in!</div>
          ) : (
            <div className={styles.feed}>
              {challenge.feed.map((item) => (
                <div className={styles.feedItem} key={item.id}>
                  <div className={styles.feedHeader}>
                    <div className={styles.user}>
                      <div className={styles.avatar}>{item.userName.charAt(0).toUpperCase()}</div>
                      <div>
                        <span className={styles.userName}>{item.userName}</span>
                        <span className={styles.date}>
                          {new Date(item.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className={styles.streak}>
                      🔥 {Math.floor(Math.random() * 30) + 1} day streak
                    </div>
                  </div>

                  {item.notes && <p className={styles.notes}>{item.notes}</p>}

                  <div className={styles.reactions}>
                    {item.reactions.map((reaction) => (
                      <button
                        key={reaction.emoji}
                        className={styles.reaction}
                        onClick={() => handleAddReaction(item.id, reaction.emoji)}
                        type="button"
                      >
                        {reaction.emoji} {reaction.count}
                      </button>
                    ))}
                    <button className={styles.addReaction} type="button">
                      <i className="fa-solid fa-plus" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Check-In Form */}
          {challenge.joined && challenge.status === 'active' && (
            <div className={styles.checkInForm}>
              <h3>Daily Check-In</h3>

              <div className={styles.formGroup}>
                <label htmlFor="challenge-check-in-date">Date</label>
                <input
                  id="challenge-check-in-date"
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                />
              </div>

              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={checkInCompleted}
                  onChange={(e) => setCheckInCompleted(e.target.checked)}
                />
                <span>Completed today</span>
              </label>

              <div className={styles.formGroup}>
                <label htmlFor="challenge-check-in-notes">Notes</label>
                <textarea
                  id="challenge-check-in-notes"
                  placeholder="Share your thoughts or progress..."
                  value={checkInNotes}
                  onChange={(e) => setCheckInNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className={styles.formActions}>
                <Button onClick={() => handleSubmitCheckIn()} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Check-In'}
                </Button>
                <Button onClick={() => handleLeavechallenge()} variant="secondary">
                  Leave Challenge
                </Button>
              </div>
            </div>
          )}
          {challenge.status === 'archived' && (
            <div className={styles.empty}>This challenge has ended and is now archived.</div>
          )}
        </div>

        {/* Leaderboard Sidebar */}
        <aside className={styles.sidebar}>
          <h2 className={styles.sectionTitle}>Leaderboard</h2>

          {leaderboard.length === 0 ? (
            <div className={styles.empty}>No participants yet</div>
          ) : (
            <div className={styles.leaderboard}>
              {leaderboard.map((entry, index) => (
                <div className={styles.leaderboardEntry} key={entry.userId}>
                  <div className={styles.rank}>
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && `#${index + 1}`}
                  </div>

                  <div className={styles.entryInfo}>
                    <span className={styles.entryName}>{entry.userName}</span>
                    <div className={styles.entryProgress}>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${entry.progress * 100}%` }}
                        />
                      </div>
                      <span>{Math.round(entry.progress * 100)}%</span>
                    </div>
                  </div>

                  <span className={styles.streak}>🔥 {entry.streak}</span>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
