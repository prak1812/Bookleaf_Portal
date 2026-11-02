import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import Nav from './components/Nav';
import Login from './pages/Login';
import Books from './pages/Books';
import NewTicket from './pages/NewTicket';
import MyTickets from './pages/MyTickets';
import AdminQueue from './pages/AdminQueue';
import AdminTicket from './pages/AdminTicket';

function RequireRole({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to='/login' replace />;
  if (user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/books'} replace />;
  return children;
}

function Home() {
  const { user, loading } = useAuth();
  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to='/login' replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/books'} replace />;
}

export default function App() {
  return (
    <>
      <Nav />
      <main className='page'>
        <Routes>
          <Route path='/login' element={<Login />} />
          <Route path='/books' element={<RequireRole role='author'><Books /></RequireRole>} />
          <Route path='/tickets/new' element={<RequireRole role='author'><NewTicket /></RequireRole>} />
          <Route path='/tickets' element={<RequireRole role='author'><MyTickets /></RequireRole>} />
          <Route path='/admin' element={<RequireRole role='admin'><AdminQueue /></RequireRole>} />
          <Route path='/admin/tickets/:id' element={<RequireRole role='admin'><AdminTicket /></RequireRole>} />
          <Route path='*' element={<Home />} />
        </Routes>
      </main>
    </>
  );
}