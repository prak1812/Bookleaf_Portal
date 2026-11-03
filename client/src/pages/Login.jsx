
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('bookleaf-theme') === 'dark'
  );

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
    localStorage.setItem('bookleaf-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

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

    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/admin' : '/books');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login-page">
      <button
        type="button"
        className="theme-toggle"
        onClick={() => setDarkMode((prev) => !prev)}
        aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
      >
        {darkMode ? '☀ Light mode' : '☾ Dark mode'}
      </button>

      <form onSubmit={submit} className="card narrow login-card">
        <div className="login-brand">
          <div className="brand-mark">B</div>
          <span>BookLeaf</span>
        </div>

        <div className="login-heading">
          <h1>Welcome back</h1>
          <p>Sign in to your support portal</p>
        </div>

        <div className="login-fields">
          <label>
            Email address
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
        </div>

        {error && <p className="error">{error}</p>}

        <button className="login-submit" disabled={busy}>
          {busy ? 'Signing in...' : 'Sign in'}
          {!busy && <span aria-hidden="true"> →</span>}
        </button>

        <p className="login-footer">
          BookLeaf Support Portal
        </p>
      </form>
    </main>
  );
}
