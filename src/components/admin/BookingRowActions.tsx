'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { confirmBooking, rejectBooking } from '@/app/actions/booking-review';

export function BookingRowActions({ bookingId, status }: { bookingId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<'confirm' | 'reject' | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (status !== 'pending') return null;

  async function run(action: 'confirm' | 'reject') {
    setErr(null);
    setLoading(action);
    const res = action === 'confirm' ? await confirmBooking(bookingId) : await rejectBooking(bookingId);
    setLoading(null);
    if (!res.ok) {
      setErr(res.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => run('confirm')}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading === 'confirm' ? '…' : 'Approve'}
        </button>
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => run('reject')}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          {loading === 'reject' ? '…' : 'Decline'}
        </button>
      </div>
      {err && <p className="max-w-[14rem] text-right text-xs text-red-600">{err}</p>}
    </div>
  );
}
