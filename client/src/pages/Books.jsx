import { useEffect, useState } from 'react';
import { api } from '../api';
import { inr } from '../constants';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : 'Not published yet');

export default function Books() {
  const [books, setBooks] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/books').then((d) => setBooks(d.books)).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className='error'>{error}</p>;
  if (!books) return <p>Loading...</p>;
  if (books.length === 0) return <p>No books on your account yet.</p>;

  return (
    <div>
      <h2>My Books</h2>
      <div className='table-wrap'>
        <table>
          <thead>
            <tr>
              <th>Title</th><th>ISBN</th><th>Genre</th><th>Published</th><th>Status</th>
              <th>MRP</th><th>Copies sold</th><th>Royalty earned</th><th>Paid</th><th>Pending</th>
            </tr>
          </thead>
          <tbody>
            {books.map((b) => (
              <tr key={b.id}>
                <td>{b.title}</td>
                <td>{b.isbn || 'Not assigned yet'}</td>
                <td>{b.genre || '-'}</td>
                <td>{fmtDate(b.publicationDate)}</td>
                <td>{b.status}</td>
                <td>{inr(b.mrp)}</td>
                <td>{b.copiesSold}</td>
                <td>{inr(b.royaltyEarned)}</td>
                <td>{inr(b.royaltyPaid)}</td>
                <td>{inr(b.royaltyPending)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}