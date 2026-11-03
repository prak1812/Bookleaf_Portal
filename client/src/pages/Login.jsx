import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className='card narrow'>
      <h1>BookLeaf Support Portal</h1>
      <label>Email<input type='email' value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
      <label>Password<input type='password' value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
      {error && <p className='error'>{error}</p>}
      <button disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
    </form>
  );
}