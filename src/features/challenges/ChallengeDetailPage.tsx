import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '@app/hooks';
import { toastShown } from '@features/ui/ui.slice';
import { extractApiErrorMessage } from '@api/apiError';
import styles from './challengeDetail.module.scss';
import Button from '@components/Button/Button';
import Modal from '@components/Modal/Modal';
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
  const [leaveConfirmationOpen, setLeaveConfirmationOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

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
    if (!id || !challenge || submitting) return;

    setSubmitting(true);
    try {
      await submitCheckIn(id, checkInDate, checkInCompleted, checkInNotes);
      setCheckInDate(new Date().toISOString().split('T')[0]);
      setCheckInCompleted(true);
      setCheckInNotes('');
      await loadChallenge();
      dispatch(toastShown('Check-in saved'));
    } catch (error) {
      dispatch(toastShown(extractApiErrorMessage(error, 'Could not save your check-in.')));
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

  const handleLeaveChallenge = async () => {
    if (!id || leaving) return;

    setLeaving(true);
    try {
      await leaveChallenge(id);
      dispatch(toastShown('You left the challenge'));
      navigate('/challenges');
    } catch (error) {
      dispatch(toastShown(extractApiErrorMessage(error, 'Could not leave the challenge.')));
    } finally {
      setLeaving(false);
    }
  };

  if (loading) {
    return <div className={styles.page}>Loading challenge...</div>;
  }

  if (!challenge) {
    return <div className={styles.page}>Challenge not found</div>;
  }

  const canCheckInToday =
    challenge.status === 'active' && today >= challenge.startDate && today <= challenge.endDate;
  const progressPercentage = Math.min(100, Math.max(0, challenge.userProgress ?? 0));

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
          {challenge.joined && (
            <span className={styles.badge}>
              {challenge.userCompletedDays ?? 0}/{challenge.userEligibleDays ?? 0} days ·{' '}
              {Math.round(progressPercentage)}%
            </span>
          )}
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
          {challenge.joined &&
            challenge.status === 'active' &&
            (canCheckInToday ? (
              <div className={styles.checkInForm}>
                <h3>Daily Check-In</h3>

                <div className={styles.formGroup}>
                  <label htmlFor="challenge-check-in-date">Date</label>
                  <input
                    id="challenge-check-in-date"
                    type="date"
                    min={challenge.startDate}
                    max={challenge.endDate < today ? challenge.endDate : today}
                    value={checkInDate}
                    onChange={(e) => {
                      setCheckInDate(e.target.value);
                      setCheckInCompleted(e.target.value === today);
                    }}
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
                  <Button
                    onClick={() => handleSubmitCheckIn()}
                    disabled={
                      submitting ||
                      checkInDate < challenge.startDate ||
                      checkInDate > challenge.endDate ||
                      checkInDate > today
                    }
                  >
                    {submitting ? 'Submitting...' : 'Submit Check-In'}
                  </Button>
                  <Button onClick={() => setLeaveConfirmationOpen(true)} variant="secondary">
                    Leave Challenge
                  </Button>
                </div>
              </div>
            ) : (
              <div className={styles.empty}>
                Check-ins are available from {challenge.startDate} through {challenge.endDate}.
              </div>
            ))}
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
                          style={{ width: `${Math.min(100, Math.max(0, entry.progress))}%` }}
                        />
                      </div>
                      <span>{Math.round(entry.progress)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
      <Modal
        isOpen={leaveConfirmationOpen}
        title="Leave Challenge"
        onClose={() => {
          if (!leaving) setLeaveConfirmationOpen(false);
        }}
      >
        <div className={styles.leaveConfirmation}>
          <p>Are you sure you want to leave this challenge?</p>
          <strong>{challenge.title}</strong>
          <div className={styles.leaveConfirmationActions}>
            <button
              type="button"
              className={styles.leaveCancelButton}
              onClick={() => setLeaveConfirmationOpen(false)}
              disabled={leaving}
            >
              No
            </button>
            <button
              type="button"
              className={styles.leaveConfirmButton}
              onClick={() => void handleLeaveChallenge()}
              disabled={leaving}
            >
              {leaving ? 'Leaving…' : 'Yes'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
