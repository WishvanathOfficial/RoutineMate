import { useEffect, useState } from 'react';
import { httpClient } from '@api/httpClient';
import { unwrap } from '@api/apiResponse';
export default function RoadmapPage() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    void httpClient
      .get('/api/roadmap')
      .then(unwrap<any[]>)
      .then(setItems);
  }, []);
  return (
    <div>
      <h2>Public Roadmap</h2>
      {items.length === 0 ? (
        <p>No roadmap items yet.</p>
      ) : (
        items.map((i) => (
          <article key={i.id}>
            <h3>{i.title}</h3>
            <p>{i.description}</p>
            <span>
              {i.status} · {i.votes} votes
            </span>
          </article>
        ))
      )}
    </div>
  );
}
