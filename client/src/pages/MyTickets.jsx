import { api } from '../api';
import { usePolling } from '../usePolling';
import Badge from '../components/Badge';

export default function MyTickets() {
  const { data, error, loading } = usePolling(() => api('/tickets').then((d) => d.tickets), 5000);

  if (loading) return <p>Loading...</p>;
  if (error && !data) return <p className='error'>{error}</p>;
  if (!data || data.length === 0) return <p>You have not raised any tickets yet.</p>;

  return (
    <div>
      <h2>My Tickets</h2>
      {data.map((t) => (
        <div className='card' key={t.id}>
          <div className='row'>
            <strong>{t.subject}</strong>
            <Badge value={t.status} />
          </div>
          <small className='muted'>
            {t.book ? t.book.title : 'General / Account Level'} · {new Date(t.createdAt).toLocaleString('en-IN')}
          </small>
          <p className='body'>{t.description}</p>
          {t.replies.length === 0 ? (
            <p className='muted'>No response yet. Our team will reply soon.</p>
          ) : (
            t.replies.map((r) => (
              <div className='reply' key={r.id}>
                <strong>{r.senderName}, BookLeaf</strong>
                <small className='muted'> {new Date(r.createdAt).toLocaleString('en-IN')}</small>
                <p className='body'>{r.body}</p>
              </div>
            ))
          )}
        </div>
      ))}
    </div>
  );
}