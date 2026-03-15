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
    const { data: { user } } = await supabase.auth.getUser();
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

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">New ticket</h2>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Subject</span>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Message</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={4}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit ticket'}
      </button>
    </form>
  );
}
