import { useEffect, useState } from 'react';
import { httpClient } from '@api/httpClient';
import { unwrap } from '@api/apiResponse';

type Friend = {
  id: string;
  status: string;
  direction: string;
  user: { id: string; name: string; avatarUrl: string | null };
};
type SearchResult = { items: Friend['user'][]; meta: { total: number } };
type Leaderboard = { items: { rank: number; score: number; user: Friend['user'] }[] };

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<'streak' | 'consistency' | 'checkins'>('streak');
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setFriends(await httpClient.get('/api/friends').then(unwrap<Friend[]>));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load friends.');
    } finally {
      setLoading(false);
    }
  };
  // The loader intentionally follows the selected metric and is recreated per render.
  useEffect(() => {
    void load();
  }, []);
  const loadLeaderboard = async () => {
    setLeaderboardLoading(true);
    try {
      setLeaderboard(
        await httpClient
          .get('/api/leaderboards', { params: { metric, scope: 'friends', window: '7d' } })
          .then(unwrap<Leaderboard>),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load leaderboard.');
    } finally {
      setLeaderboardLoading(false);
    }
  };
  useEffect(() => {
    void loadLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metric]);
  const search = async () => {
    if (query.trim().length < 2) return;
    try {
      setResults(
        await httpClient
          .get('/api/users/search', { params: { q: query } })
          .then(unwrap<SearchResult>),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed.');
    }
  };
  const send = async (userId: string) => {
    await httpClient.post('/api/friends/requests', { userId });
    await load();
  };
  const action = async (id: string, actionName: 'accept' | 'reject') => {
    await httpClient.patch(`/api/friends/requests/${id}`, { action: actionName });
    await load();
  };

  return (
    <div>
      <h2>Friends</h2>
      <div style={{ display: 'flex', gap: 8, margin: '16px 0' }}>
        <input
          aria-label="Search users"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email"
        />
        <button type="button" onClick={() => void search()}>
          Search
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      {results && (
        <section>
          <h3>Search results</h3>
          {results.items.length === 0 ? (
            <p>No users found.</p>
          ) : (
            results.items.map((user) => (
              <p key={user.id}>
                {user.name}{' '}
                <button type="button" onClick={() => void send(user.id)}>
                  Add friend
                </button>
              </p>
            ))
          )}
        </section>
      )}
      <section>
        <h3>Your friends</h3>
        {loading ? (
          <p>Loading friends…</p>
        ) : friends.length === 0 ? (
          <p>No friends yet. Search for someone to get started.</p>
        ) : (
          friends.map((friend) => (
            <p key={friend.id}>
              {friend.user.name}{' '}
              {friend.status === 'pending' && friend.direction === 'incoming' && (
                <>
                  <button type="button" onClick={() => void action(friend.id, 'accept')}>
                    Accept
                  </button>
                  <button type="button" onClick={() => void action(friend.id, 'reject')}>
                    Reject
                  </button>
                </>
              )}
            </p>
          ))
        )}
      </section>
      <section>
        <h3>Friends leaderboard</h3>
        <select
          aria-label="Leaderboard metric"
          value={metric}
          onChange={(e) => setMetric(e.target.value as typeof metric)}
        >
          <option value="streak">Current streak</option>
          <option value="consistency">Weekly consistency</option>
          <option value="checkins">Total check-ins</option>
        </select>
        <button type="button" onClick={() => void loadLeaderboard()}>
          Refresh
        </button>
        {leaderboardLoading ? (
          <p>Loading leaderboard…</p>
        ) : leaderboard?.items.length ? (
          <ol>
            {leaderboard.items.map((entry) => (
              <li key={entry.user.id}>
                {entry.rank}. <a href={`/friends?user=${entry.user.id}`}>{entry.user.name}</a> —{' '}
                {entry.score}
              </li>
            ))}
          </ol>
        ) : (
          <p>No leaderboard data yet.</p>
        )}
      </section>
    </div>
  );
}
