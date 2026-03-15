'use client';

import { useState, useEffect } from 'react';
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
    loadAvailability();
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
      setMessage('To date must be after from date.');
      return;
    }
    setLoading(true);
    setMessage(null);
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
    setMessage(isBlocking ? 'Dates blocked.' : 'Dates opened.');
    loadAvailability();
  }

  return (
    <div className="mt-4">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
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
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isBlocking}
            onChange={(e) => setIsBlocking(e.target.checked)}
          />
          <span className="text-sm">Block (uncheck to make available)</span>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Apply'}
        </button>
      </form>
      {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
      {entries.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700">Recent availability</p>
          <p className="text-xs text-gray-500">
            {entries.filter((e) => !e.is_available).length} blocked, {entries.filter((e) => e.is_available).length} available
          </p>
        </div>
      )}
    </div>
  );
}
