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

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Update ticket</h2>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Status</span>
        <select
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value as SupportTicketStatus)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Admin notes (visible to user)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
