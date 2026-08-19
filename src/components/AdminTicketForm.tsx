'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { SupportTicketStatus } from '@/types/database';

export function AdminTicketForm({
  ticketId,
  status,
  adminNotes,
}: {
  ticketId: string;
  status: SupportTicketStatus;
  adminNotes: string | null;
}) {
  const router = useRouter();
  const [newStatus, setNewStatus] = useState<SupportTicketStatus>(status);
  const [notes, setNotes] = useState(adminNotes ?? '');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from('support_tickets')
      .update({ status: newStatus, admin_notes: notes || null })
      .eq('id', ticketId);
    setLoading(false);
    router.refresh();
  }

  const fieldClass =
    'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">Response</p>
        <h2 className="font-display mt-2 text-2xl font-medium text-slate-950">Update this request</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">Your response is visible to the customer in their support center.</p>
      </div>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Status</span>
        <select
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value as SupportTicketStatus)}
          className={fieldClass}
        >
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </label>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Customer response</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          placeholder="Write a clear response or update for the customer..."
          className={fieldClass}
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-950 disabled:opacity-50 sm:w-auto"
      >
        {loading ? 'Saving…' : 'Save response'}
      </button>
    </form>
  );
}
