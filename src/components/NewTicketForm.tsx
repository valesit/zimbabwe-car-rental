'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function NewTicketForm() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    const { error: insertError } = await supabase.from('support_tickets').insert({
      user_id: user.id,
      subject,
      message,
      status: 'open',
    });
    setLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setSubject('');
    setMessage('');
    router.refresh();
  }

  const inputClass =
    'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">Contact support</p>
        <h2 className="font-display mt-2 text-2xl font-medium text-slate-950">How can we help?</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">Share the details and our team will follow up on your request.</p>
      </div>
      <label className="block">
        <span className="text-sm font-semibold text-slate-700">Subject</span>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          placeholder="e.g. Question about my pick-up"
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-slate-700">Message</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={5}
          placeholder="Tell us what you need help with..."
          className={inputClass}
        />
      </label>
      {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-950 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {loading ? 'Sending…' : 'Send request'}
      </button>
    </form>
  );
}
