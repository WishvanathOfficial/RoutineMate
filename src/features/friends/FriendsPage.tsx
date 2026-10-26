import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { selectCurrentUser } from '@features/auth/auth.selectors';
import { toastShown } from '@features/ui/ui.slice';
import { extractApiErrorMessage } from '@api/apiError';
import Button from '@components/Button/Button';
import Modal from '@components/Modal/Modal';
import styles from './friends.module.scss';
import { useTranslation } from '../../i18n/useTranslation';
import {
  getFriendships,
  getFriendsLeaderboard,
  removeFriend,
  respondToFriendRequest,
  searchUsers,
  sendFriendRequest,
  type Friendship,
  type FriendUser,
} from './friends.api';
import type { FriendsSearchResult } from './friends.api';

export default function FriendsPage() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const currentUser = useAppSelector(selectCurrentUser);
  const [tab, setTab] = useState<'friends' | 'leaderboard'>('friends');
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FriendsSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [busyFriendshipId, setBusyFriendshipId] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [friendToRemove, setFriendToRemove] = useState<Friendship | null>(null);
  const [removing, setRemoving] = useState(false);
  const [metric, setMetric] = useState<'streak' | 'consistency' | 'checkins'>('streak');
  const [window, setWindow] = useState<'7d' | '30d' | 'all'>('7d');
  const [page, setPage] = useState(1);
  const [leaderboard, setLeaderboard] = useState<{
    items: Array<{ rank: number; score: number; metric: string; user: FriendUser }>;
    meta: { page: number; pageSize: number; total: number; totalPages: number };
  } | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  const loadFriendships = useCallback(async () => {
    setLoading(true);
    try {
      setFriendships(await getFriendships());
      setError(null);
    } catch (requestError) {
      setError(extractApiErrorMessage(requestError, 'Unable to load friends.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFriendships();
  }, [loadFriendships]);

  const loadLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      setLeaderboard(
        await getFriendsLeaderboard(metric, metric === 'streak' ? 'all' : window, page),
      );
    } catch (requestError) {
      setError(extractApiErrorMessage(requestError, 'Unable to load leaderboard.'));
    } finally {
      setLeaderboardLoading(false);
    }
  }, [metric, page, window]);

  useEffect(() => {
    if (tab === 'leaderboard') void loadLeaderboard();
  }, [loadLeaderboard, tab]);

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const searchQuery = query.trim();
    if (searchQuery.length < 2) {
      setError('Enter at least 2 characters to search.');
      return;
    }
    setSearching(true);
    try {
      setResults(await searchUsers(searchQuery));
      setError(null);
    } catch (requestError) {
      setError(extractApiErrorMessage(requestError, 'Search failed.'));
    } finally {
      setSearching(false);
    }
  };

  const sendRequest = async (userId: string) => {
    setBusyUserId(userId);
    try {
      await sendFriendRequest(userId);
      dispatch(toastShown('Friend request sent'));
      await loadFriendships();
    } catch (requestError) {
      dispatch(toastShown(extractApiErrorMessage(requestError, 'Could not send friend request.')));
    } finally {
      setBusyUserId(null);
    }
  };

  const respondToRequest = async (friendship: Friendship, action: 'accept' | 'reject') => {
    setBusyFriendshipId(friendship.id);
    try {
      await respondToFriendRequest(friendship.id, action);
      dispatch(
        toastShown(action === 'accept' ? 'Friend request accepted' : 'Friend request declined'),
      );
      await loadFriendships();
    } catch (requestError) {
      dispatch(
        toastShown(extractApiErrorMessage(requestError, 'Could not update friend request.')),
      );
    } finally {
      setBusyFriendshipId(null);
    }
  };

  const confirmRemoveFriend = async () => {
    if (!friendToRemove || removing) return;
    setRemoving(true);
    try {
      await removeFriend(friendToRemove.id);
      setFriendToRemove(null);
      dispatch(toastShown('Friend removed'));
      await loadFriendships();
    } catch (requestError) {
      dispatch(toastShown(extractApiErrorMessage(requestError, 'Could not remove friend.')));
    } finally {
      setRemoving(false);
    }
  };

  const acceptedFriends = friendships.filter((item) => item.status === 'accepted');
  const incomingRequests = friendships.filter(
    (item) => item.status === 'pending' && item.direction === 'incoming',
  );
  const outgoingRequests = friendships.filter(
    (item) => item.status === 'pending' && item.direction === 'outgoing',
  );
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>{t('Friends')}</h1>
          <p>Add people and keep each other consistent.</p>
        </div>
        <form className={styles.searchForm} onSubmit={handleSearch}>
          <label className={styles.searchField}>
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
            <input
              aria-label="Add by email or name"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Add by email or name"
              minLength={2}
            />
          </label>
          <Button type="submit" disabled={searching || query.trim().length < 2}>
            {searching ? 'Searching…' : 'Add'}
          </Button>
        </form>
      </header>

      <div className={styles.tabs} role="tablist" aria-label="Friends views">
        <button
          id="friends-tab"
          className={tab === 'friends' ? styles.activeTab : ''}
          type="button"
          role="tab"
          aria-selected={tab === 'friends'}
          aria-controls="friends-panel"
          onClick={() => setTab('friends')}
        >
          Friends <span>{acceptedFriends.length}</span>
        </button>
        <button
          id="leaderboard-tab"
          className={tab === 'leaderboard' ? styles.activeTab : ''}
          type="button"
          role="tab"
          aria-selected={tab === 'leaderboard'}
          aria-controls="leaderboard-panel"
          onClick={() => setTab('leaderboard')}
        >
          Leaderboard
        </button>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {results && (
        <section className={styles.searchResults} aria-label="Search results">
          <div className={styles.sectionHeader}>
            <h2>People</h2>
            <button className={styles.textButton} type="button" onClick={() => setResults(null)}>
              Clear results
            </button>
          </div>
          {results.items.length === 0 ? (
            <p className={styles.emptyMessage}>No people found. Try another name or email.</p>
          ) : (
            <div className={styles.peopleList}>
              {results.items.map((user) => {
                const relation = friendships.find((item) => item.user.id === user.id);
                return (
                  <div className={styles.personRow} key={user.id}>
                    <Avatar user={user} />
                    <div className={styles.personInfo}>
                      <strong>{user.name}</strong>
                      <span>
                        {relation?.status === 'accepted'
                          ? 'Already friends'
                          : relation?.direction === 'outgoing'
                            ? 'Request pending'
                            : relation?.direction === 'incoming'
                              ? 'Sent you a request'
                              : 'RoutineMate member'}
                      </span>
                    </div>
                    {!relation ? (
                      <Button
                        variant="secondary"
                        onClick={() => void sendRequest(user.id)}
                        disabled={busyUserId === user.id}
                      >
                        {busyUserId === user.id ? 'Sending…' : 'Add friend'}
                      </Button>
                    ) : relation.status === 'pending' && relation.direction === 'incoming' ? (
                      <Button onClick={() => void respondToRequest(relation, 'accept')}>
                        Accept request
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {tab === 'friends' ? (
        <section id="friends-panel" role="tabpanel" aria-labelledby="friends-tab">
          {loading ? (
            <div className={styles.loading} role="status">
              Loading friends…
            </div>
          ) : (
            <>
              {incomingRequests.length > 0 && (
                <div className={styles.requestSection}>
                  <div className={styles.sectionHeader}>
                    <h2>Friend requests</h2>
                    <span className={styles.count}>{incomingRequests.length} new</span>
                  </div>
                  <div className={styles.friendGrid}>
                    {incomingRequests.map((friendship) => (
                      <FriendCard
                        key={friendship.id}
                        friendship={friendship}
                        actions={
                          <div className={styles.cardActions}>
                            <Button
                              onClick={() => void respondToRequest(friendship, 'accept')}
                              disabled={busyFriendshipId === friendship.id}
                            >
                              {busyFriendshipId === friendship.id ? 'Saving…' : 'Accept'}
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => void respondToRequest(friendship, 'reject')}
                              disabled={busyFriendshipId === friendship.id}
                            >
                              Decline
                            </Button>
                          </div>
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.sectionHeader}>
                <h2>Your friends</h2>
                {acceptedFriends.length > 0 && (
                  <span className={styles.count}>{acceptedFriends.length}</span>
                )}
              </div>
              {acceptedFriends.length === 0 ? (
                <div className={styles.emptyState}>
                  <span className={styles.emptyIcon} aria-hidden="true">
                    <i className="fa-solid fa-user-group" />
                  </span>
                  <h3>No friends yet</h3>
                  <p>Search by name or email to find people you know.</p>
                </div>
              ) : (
                <div className={styles.friendGrid}>
                  {acceptedFriends.map((friendship) => (
                    <FriendCard
                      key={friendship.id}
                      friendship={friendship}
                      actions={
                        <Button
                          variant="secondary"
                          onClick={() => setFriendToRemove(friendship)}
                          aria-label={`Remove ${friendship.user.name}`}
                        >
                          <i className="fa-solid fa-user-minus" aria-hidden="true" /> Remove
                        </Button>
                      }
                    />
                  ))}
                </div>
              )}

              {outgoingRequests.length > 0 && (
                <div className={styles.outgoingSection}>
                  <div className={styles.sectionHeader}>
                    <h2>Sent requests</h2>
                  </div>
                  <div className={styles.friendGrid}>
                    {outgoingRequests.map((friendship) => (
                      <FriendCard
                        key={friendship.id}
                        friendship={friendship}
                        statusLabel="Request pending"
                        actions={
                          <Button
                            variant="secondary"
                            onClick={() => setFriendToRemove(friendship)}
                            aria-label={`Cancel request to ${friendship.user.name}`}
                          >
                            Cancel request
                          </Button>
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      ) : (
        <section id="leaderboard-panel" role="tabpanel" aria-labelledby="leaderboard-tab">
          <div className={styles.leaderboardHeader}>
            <div>
              <h2>Friends leaderboard</h2>
              <p>Compare shared activity with your friends.</p>
            </div>
            <div className={styles.leaderboardControls}>
              <label>
                <span>Rank by</span>
                <select
                  aria-label="Leaderboard metric"
                  value={metric}
                  onChange={(event) => {
                    setMetric(event.target.value as typeof metric);
                    setPage(1);
                  }}
                >
                  <option value="streak">Current streak</option>
                  <option value="consistency">Consistency</option>
                  <option value="checkins">Check-ins</option>
                </select>
              </label>
              <label>
                <span>Period</span>
                <select
                  aria-label="Leaderboard period"
                  value={window}
                  disabled={metric === 'streak'}
                  onChange={(event) => {
                    setWindow(event.target.value as typeof window);
                    setPage(1);
                  }}
                >
                  <option value="7d">7 days</option>
                  <option value="30d">30 days</option>
                  <option value="all">All time</option>
                </select>
              </label>
              <Button
                variant="secondary"
                onClick={() => void loadLeaderboard()}
                disabled={leaderboardLoading}
                aria-label="Refresh leaderboard"
                title="Refresh leaderboard"
              >
                <i className="fa-solid fa-rotate" aria-hidden="true" />
              </Button>
            </div>
          </div>
          {leaderboardLoading ? (
            <div className={styles.loading} role="status">
              Loading leaderboard…
            </div>
          ) : leaderboard?.items.length ? (
            <>
              <ol className={styles.leaderboardList}>
                {leaderboard.items.map((entry) => (
                  <li
                    className={`${styles.leaderboardRow} ${entry.user.id === currentUser?.id ? styles.currentUser : ''}`}
                    key={entry.user.id}
                  >
                    <span className={styles.rank}>{entry.rank}</span>
                    <Avatar user={entry.user} />
                    <span className={styles.leaderName}>
                      {entry.user.id === currentUser?.id ? 'You' : entry.user.name}
                    </span>
                    <strong className={styles.score}>{formatScore(entry.score, metric)}</strong>
                  </li>
                ))}
              </ol>
              {leaderboard.meta.totalPages > 1 && (
                <div className={styles.pagination}>
                  <Button
                    variant="secondary"
                    onClick={() => setPage((current) => current - 1)}
                    disabled={page <= 1}
                  >
                    Previous
                  </Button>
                  <span>
                    Page {page} of {leaderboard.meta.totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() => setPage((current) => current + 1)}
                    disabled={page >= leaderboard.meta.totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon} aria-hidden="true">
                <i className="fa-solid fa-ranking-star" />
              </span>
              <h3>No leaderboard activity yet</h3>
              <p>Add friends and keep logging routines to see your shared ranking.</p>
            </div>
          )}
        </section>
      )}

      <Modal
        isOpen={friendToRemove !== null}
        title={friendToRemove?.status === 'pending' ? 'Cancel Friend Request' : 'Remove Friend'}
        onClose={() => {
          if (!removing) setFriendToRemove(null);
        }}
      >
        <div className={styles.confirmation}>
          <p>
            {friendToRemove?.status === 'pending'
              ? `Cancel your friend request to ${friendToRemove.user.name}?`
              : `Remove ${friendToRemove?.user.name} from your friends?`}
          </p>
          <div className={styles.confirmationActions}>
            <Button variant="secondary" onClick={() => setFriendToRemove(null)} disabled={removing}>
              No
            </Button>
            <Button variant="danger" onClick={() => void confirmRemoveFriend()} disabled={removing}>
              {removing ? 'Removing…' : 'Yes'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Avatar({ user }: { user: FriendUser }) {
  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return user.avatarUrl ? (
    <img className={styles.avatar} src={user.avatarUrl} alt="" />
  ) : (
    <span className={styles.avatarFallback} aria-hidden="true">
      {initials || '?'}
    </span>
  );
}

function FriendCard({
  friendship,
  statusLabel,
  actions,
}: {
  friendship: Friendship;
  statusLabel?: string;
  actions?: React.ReactNode;
}) {
  return (
    <article className={styles.friendCard}>
      <Avatar user={friendship.user} />
      <div className={styles.friendInfo}>
        <strong>{friendship.user.name}</strong>
        <span>
          {statusLabel ?? (friendship.status === 'accepted' ? 'Friend' : 'Friend request')}
        </span>
      </div>
      {actions && <div className={styles.friendActions}>{actions}</div>}
    </article>
  );
}

function formatScore(score: number, metric: 'streak' | 'consistency' | 'checkins'): string {
  if (metric === 'streak') return `${score} ${score === 1 ? 'day' : 'days'}`;
  if (metric === 'consistency') return `${score}%`;
  return `${score} ${score === 1 ? 'check-in' : 'check-ins'}`;
}
