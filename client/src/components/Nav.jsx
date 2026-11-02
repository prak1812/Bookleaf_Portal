import { Link } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Nav() {
  const { user, logout } = useAuth();
  if (!user) return null;
  return (
    <nav className='nav'>
      <strong>BookLeaf Support</strong>
      {user.role === 'author' ? (
        <>
          <Link to='/books'>My Books</Link>
          <Link to='/tickets/new'>Submit a Query</Link>
          <Link to='/tickets'>My Tickets</Link>
        </>
      ) : (
        <Link to='/admin'>Ticket Queue</Link>
      )}
      <span className='spacer' />
      <span>{user.name}</span>
      <button className='secondary' onClick={logout}>Log out</button>
    </nav>
  );
}