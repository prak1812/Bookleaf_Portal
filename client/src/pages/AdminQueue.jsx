import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { usePolling } from '../usePolling';
import { CATEGORIES, PRIORITIES, STATUSES } from '../constants';
import Badge from '../components/Badge';

const EMPTY = { status: '', category: '', priority: '', assigned: '', from: '', to: '' };
const pairs = (list) => list.map((s) => [s, s]);
const ageDays = (d) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);

function Select({ label, value, onChange, options }) {
  return (
    <label>{label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value=''>All</option>
        {options.map(([v, text]) => <option key={v} value={v}>{text}</option>)}
      </select>
    </label>
  );
}

export default function AdminQueue() {
  const [filters, setFilters] = useState(EMPTY);
  const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();
  const { data, error, loading } = usePolling(
    () => api(`/tickets?${qs}`).then((d) => d.tickets), 5000, [qs]
  );
  const set = (key) => (value) => setFilters({ ...filters, [key]: value });

  return (
    <div>
      <h2>Ticket Queue</h2>
      <div className='filters'>
        <Select label='Status' value={filters.status} onChange={set('status')} options={pairs(STATUSES)} />
        <Select label='Category' value={filters.category} onChange={set('category')} options={pairs(CATEGORIES)} />
        <Select label='Priority' value={filters.priority} onChange={set('priority')} options={pairs(PRIORITIES)} />
        <Select label='Assigned' value={filters.assigned} onChange={set('assigned')}
          options={[['me', 'Assigned to me'], ['unassigned', 'Unassigned']]} />
        <label>From<input type='date' value={filters.from} onChange={(e) => set('from')(e.target.value)} /></label>
        <label>To<input type='date' value={filters.to} onChange={(e) => set('to')(e.target.value)} /></label>
        <button className='secondary' onClick={() => setFilters(EMPTY)}>Clear</button>
      </div>

      {loading && <p>Loading...</p>}
      {error && !data && <p className='error'>{error}</p>}
      {data && data.length === 0 && <p>No tickets match these filters.</p>}
      {data && data.length > 0 && (
        <div className='table-wrap'>
          <table>
            <thead>
              <tr><th>Priority</th><th>Subject</th><th>Author</th><th>Category</th><th>Status</th><th>Assigned</th><th>Age</th></tr>
            </thead>
            <tbody>
              {data.map((t) => {
                const age = ageDays(t.createdAt);
                const stale = (t.status === 'Open' || t.status === 'In Progress') && age >= 3;
                return (
                  <tr key={t.id} className={stale ? 'stale' : ''}>
                    <td>{t.priority ? <Badge value={t.priority} /> : <span className='muted'>Classifying...</span>}</td>
                    <td><Link to={`/admin/tickets/${t.id}`}>{t.subject}</Link></td>
                    <td>{t.author.name}</td>
                    <td>{t.category || '-'}{t.categorySource === 'admin' && <small className='muted'> (edited)</small>}</td>
                    <td><Badge value={t.status} /></td>
                    <td>{t.assignedTo ? t.assignedTo.name : <span className='muted'>Unassigned</span>}</td>
                    <td>{age === 0 ? 'Today' : `${age}d`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}