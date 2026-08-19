'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AdminCreateUserForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [mode, setMode] = useState<'invite' | 'password'>('invite');
  const [role, setRole] = useState<'user' | 'admin'>('user');
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
          role,
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

  const inputClass =
    'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10';

  return (
    <details className="group rounded-2xl border border-slate-200/70 bg-white shadow-[0_16px_40px_-36px_rgba(15,23,42,0.5)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-slate-800 marker:hidden">
        Invite a customer or administrator
        <span className="text-lg font-normal text-emerald-800 transition group-open:rotate-45">+</span>
      </summary>
      <div className="border-t border-slate-100 px-5 pb-6 pt-5 sm:px-6">
        <p className="text-sm leading-6 text-slate-500">Send an invitation by email or create an account with a temporary password.</p>
        <form onSubmit={(e) => void onSubmit(e)} className="mt-5 grid gap-5 lg:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="customer@example.com" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Display name</span>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputClass} placeholder="Jane Doe" />
          </label>

          <fieldset className="rounded-2xl bg-slate-50 p-4">
            <legend className="px-1 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Account role</legend>
            <div className="mt-2 space-y-3">
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input type="radio" name="userRole" checked={role === 'user'} onChange={() => setRole('user')} className="text-emerald-700 focus:ring-emerald-500" />
                Customer / renter
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input type="radio" name="userRole" checked={role === 'admin'} onChange={() => setRole('admin')} className="text-emerald-700 focus:ring-emerald-500" />
                Administrator
              </label>
            </div>
          </fieldset>

          <fieldset className="rounded-2xl bg-slate-50 p-4">
            <legend className="px-1 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Create account</legend>
            <div className="mt-2 space-y-3">
              <label className="flex items-start gap-3 text-sm text-slate-700">
                <input type="radio" name="createMode" checked={mode === 'invite'} onChange={() => setMode('invite')} className="mt-0.5 text-emerald-700 focus:ring-emerald-500" />
                Send invitation email
              </label>
              <label className="flex items-start gap-3 text-sm text-slate-700">
                <input type="radio" name="createMode" checked={mode === 'password'} onChange={() => setMode('password')} className="mt-0.5 text-emerald-700 focus:ring-emerald-500" />
                Set a temporary password
              </label>
            </div>
          </fieldset>

          {mode === 'password' ? (
            <label className="block lg:col-span-2 lg:max-w-md">
              <span className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Temporary password</span>
              <input type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} className={inputClass} />
            </label>
          ) : null}

          <div className="lg:col-span-2">
            {error ? <p className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
            {message ? <p className="mb-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-950 disabled:opacity-50"
            >
              {loading ? 'Working…' : mode === 'invite' ? 'Send invitation' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </details>
  );
}
