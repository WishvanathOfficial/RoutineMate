import { useEffect, useState } from 'react';
import { httpClient } from '@api/httpClient';
import { unwrap } from '@api/apiResponse';
export default function FeedbackPage() {
  const [items, setItems] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const load = async () => setItems(await httpClient.get('/api/feedback').then(unwrap<any[]>));
  useEffect(() => {
    void load();
  }, []);
  const submit = async () => {
    await httpClient.post('/api/feedback', { title, description });
    setTitle('');
    setDescription('');
    await load();
  };
  const vote = async (id: string) => {
    await httpClient.post(`/api/feedback/${id}/votes`);
    await load();
  };
  return (
    <div>
      <h2>Feedback</h2>
      <input
        aria-label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Suggestion title"
      />
      <textarea
        aria-label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe your idea"
      />
      <button type="button" onClick={() => void submit()}>
        Suggest feature
      </button>
      {items.map((i) => (
        <article key={i.id}>
          <h3>{i.title}</h3>
          <p>{i.description}</p>
          <button type="button" onClick={() => void vote(i.id)}>
            Vote ({i.votes})
          </button>
        </article>
      ))}
    </div>
  );
}
