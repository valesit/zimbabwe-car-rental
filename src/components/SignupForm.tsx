'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function SignupForm({ redirectTo = '/dashboard' }: { redirectTo?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: displayName || undefined },
      },
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  const inputClass =
    'mt-2 h-14 w-full rounded-2xl border border-[#dfe6e2] bg-white px-4 text-[15px] font-medium text-[#263a32] outline-none transition placeholder:text-[#98a39e] hover:border-[#cbd8d1] focus:border-[#3b8a69] focus:ring-4 focus:ring-emerald-700/10';

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <label className="block">
        <span className="text-sm font-semibold text-[#31433c]">Full name</span>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          autoComplete="name"
          placeholder="Your name"
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-[#31433c]">Email address</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="you@example.com"
          required
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-[#31433c]">Password</span>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="Create a password"
            required
            minLength={6}
            className={`${inputClass} pr-16`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-4 top-1/2 mt-1 -translate-y-1/2 text-xs font-semibold text-[#4d675c] transition hover:text-[#176447]"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        <span className="mt-2 block text-xs leading-5 text-[#738079]">Use at least 6 characters.</span>
      </label>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700" role="alert">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-[#176447] px-5 text-[15px] font-semibold text-white shadow-[0_14px_30px_-18px_rgba(18,88,62,0.62)] transition hover:bg-[#125239] focus:outline-none focus:ring-4 focus:ring-emerald-700/15 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  );
}
