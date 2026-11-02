import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function NewTicket() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState({ bookId: '', subject: '', description: '' });
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/books').then((d) => setBooks(d.books)).catch(() => {});
  }, []);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/tickets', {
        method: 'POST',
        body: { bookId: form.bookId || null, subject: form.subject, description: form.description },
      });
      navigate('/tickets');
    } catch (err) {
      // zod errors arrive as { field: [messages] } in err.details
      const first = err.details && Object.values(err.details)[0] && Object.values(err.details)[0][0];
      setError(first ? `${err.message}: ${first}` : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className='card narrow'>
      <h2>Submit a Support Query</h2>
      <label>Which book is this about?
        <select value={form.bookId} onChange={set('bookId')}>
          <option value=''>General / Account Level</option>
          {books.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
        </select>
      </label>
      <label>Subject<input value={form.subject} onChange={set('subject')} maxLength={150} required /></label>
      <label>Describe your query
        <textarea rows={7} value={form.description} onChange={set('description')} required />
      </label>
      <label>Attachment (optional)
        <input type='file' onChange={(e) => setFileName(e.target.files[0] ? e.target.files[0].name : '')} />
      </label>
      {fileName && <p className='muted'>Selected: {fileName} (upload is not enabled in this version)</p>}
      {error && <p className='error'>{error}</p>}
      <button disabled={busy}>{busy ? 'Submitting...' : 'Submit query'}</button>
    </form>
  );
}