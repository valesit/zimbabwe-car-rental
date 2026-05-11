'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

type EditorMode = 'block' | 'unblock';

/** Owner/admin manual blocks on `car_availability`. Dates are open by default (no row = bookable except paid/booked ranges). */
export function AvailabilityEditor({ carId }: { carId: string }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [mode, setMode] = useState<EditorMode>('block');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [blockedCount, setBlockedCount] = useState<number | null>(null);

  const supabase = createClient();

  async function loadBlockedSummary() {
    const start = new Date();
    start.setMonth(start.getMonth() - 1);
    const end = new Date();
    end.setMonth(end.getMonth() + 3);
    const { data } = await supabase
      .from('car_availability')
      .select('available_date')
      .eq('car_id', carId)
      .eq('is_available', false)
      .gte('available_date', start.toISOString().slice(0, 10))
      .lte('available_date', end.toISOString().slice(0, 10));
    setBlockedCount((data ?? []).length);
  }

  useEffect(() => {
    loadBlockedSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!from || !to) {
      setMessage('Please set both from and to dates.');
      return;
    }
    const start = new Date(from);
    const end = new Date(to);
    if (end < start) {
      setMessage('The end date must be on or after the start date.');
      return;
    }
    setLoading(true);
    setMessage(null);
    const isBlocking = mode === 'block';
    const days: { car_id: string; available_date: string; is_available: boolean }[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push({
        car_id: carId,
        available_date: d.toISOString().slice(0, 10),
        is_available: !isBlocking,
      });
    }
    const { error } = await supabase.from('car_availability').upsert(days, {
      onConflict: 'car_id,available_date',
    });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage(isBlocking ? 'Those dates are now blocked.' : 'Block removed — those dates are open again (unless another booking covers them).');
    loadBlockedSummary();
  }

  return (
    <div className="mt-4 space-y-4">
      <p className="text-sm text-gray-700">
        <span className="font-medium text-gray-900">Dates are open by default.</span> Block days when the car isn’t available.
        Paid bookings block the calendar automatically; declining a cancelled request re-opens those dates when the app clears the
        block.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">From</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">To</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <fieldset className="flex flex-col gap-2 sm:min-w-[12rem]">
          <legend className="sr-only">Action</legend>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
            <input
              type="radio"
              name="avail-mode"
              checked={mode === 'block'}
              onChange={() => setMode('block')}
            />
            Block these dates
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
            <input type="radio" name="avail-mode" checked={mode === 'unblock'} onChange={() => setMode('unblock')} />
            Remove block — open these dates
          </label>
        </fieldset>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Apply'}
        </button>
      </form>
      {message && <p className="text-sm text-gray-600">{message}</p>}
      {blockedCount !== null && (
        <p className="text-xs text-gray-500">
          Manual blocks in the next few months: <span className="font-medium text-gray-700">{blockedCount}</span> day
          {blockedCount === 1 ? '' : 's'}
        </p>
      )}
    </div>
  );
}
