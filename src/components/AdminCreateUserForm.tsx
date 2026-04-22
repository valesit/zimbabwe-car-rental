'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AdminCreateUserForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [mode, setMode] = useState<'invite' | 'password'>('invite');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          displayName: displayName.trim() || undefined,
          mode,
          password: mode === 'password' ? password : undefined,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Request failed.');
        return;
      }
      setMessage(data.message ?? 'Done.');
      setEmail('');
      setDisplayName('');
      setPassword('');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <h2 className="font-brand text-lg font-semibold text-slate-900">Create user</h2>
      <p className="mt-1 text-sm text-slate-600">
        Invite by email (recommended) or create an account with a temporary password. New users get
        the default <span className="font-medium">user</span> role; use <span className="font-medium">Make admin</span>{' '}
        below to grant admin access.
      </p>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-4 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full max-w-md rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            placeholder="renter@example.com"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Display name (optional)</span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 w-full max-w-md rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            placeholder="Jane Doe"
          />
        </label>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-700">How to create</legend>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="createMode"
              checked={mode === 'invite'}
              onChange={() => setMode('invite')}
            />
            Send invitation email (user sets their own password)
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="createMode"
              checked={mode === 'password'}
              onChange={() => setMode('password')}
            />
            Set password now (min. 8 characters; share securely with the user)
          </label>
        </fieldset>
        {mode === 'password' && (
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              required={mode === 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              className="mt-1 w-full max-w-md rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </label>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-emerald-800">{message}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 disabled:opacity-50"
        >
          {loading ? 'Working…' : mode === 'invite' ? 'Send invite' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
