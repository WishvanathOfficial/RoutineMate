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

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
  useEffect(() => {
    void load();
  }, []);
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
    </div>
  );
}
