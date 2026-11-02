import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { usePolling } from '../usePolling';
import { CATEGORIES, PRIORITIES, STATUSES } from '../constants';
import Badge from '../components/Badge';

const when = (d) => new Date(d).toLocaleString('en-IN');

export default function AdminTicket() {
  const { id } = useParams();
  const { data: ticket, error, refresh } = usePolling(
    () => api(`/tickets/${id}`).then((d) => d.ticket), 5000, [id]
  );
  const [reply, setReply] = useState('');
  const [note, setNote] = useState('');
  const [aiState, setAiState] = useState('idle'); // idle | loading | failed
  const [msg, setMsg] = useState('');
  const drafted = useRef(false);

  // Run an action, show any error, then refresh the ticket.
  const run = async (fn) => {
    setMsg('');
    try { await fn(); await refresh(); } catch (e) { setMsg(e.message); }
  };

  const loadDraft = async (regenerate = false) => {
    setAiState('loading');
    try {
      const d = await api(`/tickets/${id}/draft${regenerate ? '?regenerate=true' : ''}`, { method: 'POST' });
      setReply(d.draft);
      setAiState('idle');
    } catch (e) {
      setAiState(e.code === 'AI_UNAVAILABLE' ? 'failed' : 'idle');
      if (e.code !== 'AI_UNAVAILABLE') setMsg(e.message);
    }
  };

  // Ask for the draft once, after the classifier has had its turn (the server reuses a saved draft).
  useEffect(() => {
    if (ticket && ticket.categorySource !== 'pending' && !drafted.current) {
      drafted.current = true;
      loadDraft();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket]);

  if (error && !ticket) return <p className='error'>{error}</p>;
  if (!ticket) return <p>Loading...</p>;

  const patch = (fields) => run(() => api(`/tickets/${id}`, { method: 'PATCH', body: fields }));
  const sendReply = () => run(async () => {
    await api(`/tickets/${id}/replies`, { method: 'POST', body: { body: reply } });
    setReply('');
  });
  const addNote = () => run(async () => {
    await api(`/tickets/${id}/notes`, { method: 'POST', body: { body: note } });
    setNote('');
  });

  return (
    <div>
      <Link to='/admin'>Back to queue</Link>
      <h2>{ticket.subject}</h2>
      {msg && <p className='error'>{msg}</p>}
      <div className='grid'>
        <div>
          <div className='card'>
            <small className='muted'>
              {ticket.author.name} · {ticket.book ? ticket.book.title : 'General / Account Level'} · {when(ticket.createdAt)}
            </small>
            <p className='body'>{ticket.description}</p>
          </div>

          {ticket.replies.map((r) => (
            <div className='reply' key={r.id}>
              <strong>{r.senderName}</strong> <small className='muted'>{when(r.createdAt)}</small>
              <p className='body'>{r.body}</p>
            </div>
          ))}

          <div className='card'>
            <h3>Reply to author</h3>
            {aiState === 'loading' && <p className='muted'>Drafting with AI...</p>}
            {aiState === 'failed' && <p className='warn'>AI drafting is unavailable right now. Write the reply manually.</p>}
            <textarea rows={10} value={reply} onChange={(e) => setReply(e.target.value)} placeholder='Write your reply...' />
            <div className='row'>
              <button onClick={sendReply} disabled={!reply.trim()}>Send reply</button>
              <button className='secondary' onClick={() => loadDraft(true)} disabled={aiState === 'loading'}>
                Regenerate AI draft
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className='card'>
            <h3>Manage</h3>
            <label>Status
              <select value={ticket.status} onChange={(e) => patch({ status: e.target.value })}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label>Category <small className='muted'>(set by {ticket.categorySource})</small>
              <select value={ticket.category || ''} onChange={(e) => patch({ category: e.target.value })}>
                {!ticket.category && <option value=''>Classifying...</option>}
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label>Priority <small className='muted'>(set by {ticket.prioritySource})</small>
              <select value={ticket.priority || ''} onChange={(e) => patch({ priority: e.target.value })}>
                {!ticket.priority && <option value=''>Classifying...</option>}
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </label>
            {ticket.aiReasoning && <p className='muted'>AI note: {ticket.aiReasoning}</p>}
            <p>Assigned to: <strong>{ticket.assignedTo ? ticket.assignedTo.name : 'Nobody'}</strong></p>
            <div className='row'>
              <button className='secondary' onClick={() => patch({ assignedTo: 'me' })}>Assign to me</button>
              {ticket.assignedTo && <button className='secondary' onClick={() => patch({ assignedTo: null })}>Unassign</button>}
            </div>
          </div>

          <div className='card'>
            <h3>Internal notes</h3>
            <p className='muted'>Never visible to the author.</p>
            {ticket.notes.map((n) => (
              <div className='note' key={n.id}>
                <strong>{n.adminName}</strong> <small className='muted'>{when(n.createdAt)}</small>
                <p className='body'>{n.body}</p>
              </div>
            ))}
            <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder='Add a note...' />
            <button onClick={addNote} disabled={!note.trim()}>Add note</button>
          </div>
        </div>
      </div>
    </div>
  );
}