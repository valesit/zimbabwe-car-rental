'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function AvailabilityEditor({ carId }: { carId: string }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [isBlocking, setIsBlocking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [entries, setEntries] = useState<{ available_date: string; is_available: boolean }[]>([]);

  const supabase = createClient();

  async function loadAvailability() {
    const start = new Date();
    start.setMonth(start.getMonth() - 1);
    const end = new Date();
    end.setMonth(end.getMonth() + 2);
    const { data } = await supabase
      .from('car_availability')
      .select('available_date, is_available')
      .eq('car_id', carId)
      .gte('available_date', start.toISOString().slice(0, 10))
      .lte('available_date', end.toISOString().slice(0, 10))
      .order('available_date');
    setEntries(data ?? []);
  }

  useEffect(() => {
    void loadAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!from || !to) {
      setMessage('Please set both dates.');
      return;
    }
    const start = new Date(from);
    const end = new Date(to);
    if (end < start) {
      setMessage('The end date must be after the start date.');
      return;
    }
    setLoading(true);
    setMessage(null);
    const days: { car_id: string; available_date: string; is_available: boolean }[] = [];
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      days.push({
        car_id: carId,
        available_date: date.toISOString().slice(0, 10),
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
    setMessage(isBlocking ? 'Dates blocked successfully.' : 'Dates opened successfully.');
    await loadAvailability();
  }

  const fieldClass =
    'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10';

  const blockedCount = entries.filter((entry) => !entry.is_available).length;
  const openCount = entries.filter((entry) => entry.is_available).length;

  return (
    <div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">Availability</p>
        <h2 className="font-display mt-2 text-2xl font-medium text-slate-950">Block or reopen dates</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">Use this when a vehicle is unavailable for maintenance, private use or another operational reason.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-5 lg:grid-cols-[1fr_1fr_1.15fr_auto] lg:items-end">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">From</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={fieldClass} />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">To</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} min={from || undefined} className={fieldClass} />
        </label>
        <label className="flex min-h-[47px] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isBlocking}
            onChange={(e) => setIsBlocking(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
          />
          <span><span className="font-semibold">Block these dates</span><span className="block text-xs text-slate-400">Uncheck to make them available</span></span>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="min-h-[47px] rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-950 disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Apply'}
        </button>
      </form>

      {message ? <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{message}</p> : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Blocked dates</p>
          <p className="font-display mt-1 text-2xl font-medium text-slate-950">{blockedCount}</p>
          <p className="mt-1 text-xs text-slate-500">Within the recent availability window</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700/70">Explicitly open dates</p>
          <p className="font-display mt-1 text-2xl font-medium text-emerald-950">{openCount}</p>
          <p className="mt-1 text-xs text-emerald-800/60">Dates reopened through this editor</p>
        </div>
      </div>
    </div>
  );
}
