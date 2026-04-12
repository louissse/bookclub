import { createRoute, redirect } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { authClient } from '../lib/auth-client';
import { useState } from 'react';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (session.data?.session) {
      throw redirect({ to: '/books' });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = Route.useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await authClient.signIn.email({ email, password });

    if (error) {
      setError(error.message ?? 'Login failed');
      setLoading(false);
      return;
    }

    navigate({ to: '/books' });
  }

  return (
    <div style={{ maxWidth: 360, margin: '100px auto', padding: '0 16px' }}>
      <h1>Bookclub</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="email">Email</label>
          <br />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="password">Password</label>
          <br />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: 10 }}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
