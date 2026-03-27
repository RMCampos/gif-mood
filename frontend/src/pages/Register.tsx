import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { AuthResponse } from '../types/index.js';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth.js';

// Plain axios instance without the 401-redirect interceptor, for unauthenticated checks
const publicApi = axios.create({ baseURL: api.defaults.baseURL, headers: { 'Content-Type': 'application/json' } });

type UsernameStatus = 'idle' | 'checking' | 'available' | 'unavailable' | 'invalid';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const normalized = username.trim().toLowerCase();
    if (normalized.length === 0) { setUsernameStatus('idle'); return; }
    if (normalized.length < 3 || !/^[a-z_]+$/.test(normalized)) {
      setUsernameStatus('invalid');
      return;
    }
    setUsernameStatus('checking');
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await publicApi.get<{ available: boolean }>(`/users/check-username?username=${encodeURIComponent(normalized)}`);
        setUsernameStatus(data.available ? 'available' : 'unavailable');
      } catch {
        setUsernameStatus('idle');
      }
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [username]);

  const usernameBlocked = usernameStatus === 'invalid' || usernameStatus === 'unavailable' || usernameStatus === 'checking';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const normalizedUsername = username.trim().toLowerCase();
    if (normalizedUsername.length < 3) { setError('Username must be at least 3 characters'); return; }
    if (!/^[a-z_]+$/.test(normalizedUsername)) {
      setError('Username can only contain letters (a-z) and underscores');
      return;
    }
    if (usernameBlocked) return;
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await api.post('/auth/register', { username: normalizedUsername, email, password });
      const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
      login(data.token);
      navigate('/home', { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message;
        setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Registration failed'));
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  }

  function getUsernameInputClass() {
    if (usernameStatus === 'available') return 'form-control is-valid';
    if (usernameStatus === 'invalid' || usernameStatus === 'unavailable') return 'form-control is-invalid';
    return 'form-control';
  }

  function getUsernameFeedback() {
    if (usernameStatus === 'checking') return <div className="form-text">Checking availability…</div>;
    if (usernameStatus === 'available') return <div className="valid-feedback d-block">Username is available!</div>;
    if (usernameStatus === 'unavailable') return <div className="invalid-feedback d-block">Username is already taken.</div>;
    if (usernameStatus === 'invalid') {
      const normalized = username.trim().toLowerCase();
      if (normalized.length < 3) return <div className="invalid-feedback d-block">At least 3 characters required.</div>;
      return <div className="invalid-feedback d-block">Letters (a-z) and underscores only.</div>;
    }
    return <div className="form-text">Letters (a-z) and underscores only. No spaces or hyphens.</div>;
  }

  return (
    <main className="d-flex align-items-center justify-content-center min-vh-100 px-3">
      <div className="card shadow-sm p-4" style={{ maxWidth: 420, width: '100%' }}>
        <h2 className="text-center mb-4 fw-bold">Create account 🎭</h2>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label className="form-label" htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className={getUsernameInputClass()}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={30}
              autoComplete="username"
            />
            {getUsernameFeedback()}
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="mb-4">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <div className="form-text">At least 8 characters.</div>
          </div>
          <button className="btn btn-primary w-100" type="submit" disabled={loading || usernameBlocked}>
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <p className="text-center mt-3 mb-0 text-muted small">
          Already have an account?{' '}
          <Link to="/login" className="text-decoration-none">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
