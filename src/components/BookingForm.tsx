'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatDailyRateUsd } from '@/lib/money';
import { AvailabilityCalendar, type AvailabilityRow } from '@/components/AvailabilityCalendar';
import {
  buildBlockedSet,
  isRangeEntirelyOpen,
  toISODateLocal,
} from '@/lib/availability';

interface BookingFormProps {
  carId: string;
  dailyRate: number;
  availability: AvailabilityRow[];
  nextAvailableDate: string | null;
  /** Inclusive last bookable day (YYYY-MM-DD) */
  horizonEnd: string;
}

export function BookingForm({
  carId,
  dailyRate,
  availability,
  nextAvailableDate,
  horizonEnd,
}: BookingFormProps) {
  const router = useRouter();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const blockedSet = useMemo(() => buildBlockedSet(availability), [availability]);
  const todayStr = useMemo(() => toISODateLocal(new Date()), []);

  function getDaysBetween(start: string, end: string): number {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
  }

  function isRangeAvailable(start: string, end: string): boolean {
    return isRangeEntirelyOpen(start, end, todayStr, horizonEnd, blockedSet);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!startDate || !endDate) {
      setError('Please select start and end dates.');
      return;
    }
    const days = getDaysBetween(startDate, endDate);
    if (days < 1) {
      setError('End date must be after start date.');
      return;
    }
    if (!isRangeAvailable(startDate, endDate)) {
      const hint = nextAvailableDate
        ? ` Next open day: ${formatFriendlyDate(nextAvailableDate)}.`
        : '';
      setError(`Selected dates are not fully available.${hint}`);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?redirect=/listings/${carId}`);
      return;
    }
    const total = dailyRate * days;
    const { error: bookError } = await supabase.from('bookings').insert({
      car_id: carId,
      renter_id: user.id,
      start_date: startDate,
      end_date: endDate,
      status: 'pending',
      total_amount_usd: total,
    });
    if (bookError) {
      setError(bookError.message);
      setLoading(false);
      return;
    }
    const availabilityBlocks: { car_id: string; available_date: string; is_available: boolean }[] = [];
    for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
      availabilityBlocks.push({ car_id: carId, available_date: d.toISOString().slice(0, 10), is_available: false });
    }
    await supabase.from('car_availability').upsert(availabilityBlocks, { onConflict: 'car_id,available_date' });
    setLoading(false);
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      {nextAvailableDate ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
          <span className="font-semibold text-emerald-800">Next available:</span>{' '}
          {formatFriendlyDate(nextAvailableDate)}
        </p>
      ) : (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          No open days in the next booking window — every day may be blocked. Contact the owner.
        </p>
      )}

      <div>
        <p className="mb-2 text-sm font-semibold text-emerald-900">Availability</p>
        <AvailabilityCalendar
          availability={availability}
          horizonEnd={horizonEnd}
          startDate={startDate}
          endDate={endDate}
          initialVisibleMonth={nextAvailableDate}
          onRangeChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
            setError(null);
          }}
        />
      </div>

      <label className="block">
        <span className="text-sm font-medium text-gray-700">Start date</span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          min={todayStr}
          max={horizonEnd}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">End date</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          min={startDate || todayStr}
          max={horizonEnd}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </label>
      {startDate && endDate && getDaysBetween(startDate, endDate) > 0 && (
        <p className="text-sm font-medium text-emerald-800">
          {getDaysBetween(startDate, endDate)} days ·{' '}
          <span className="text-emerald-700">
            {formatDailyRateUsd(dailyRate * getDaysBetween(startDate, endDate))} total
          </span>
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? 'Booking...' : 'Request to book'}
      </button>
      <p className="text-center text-xs text-gray-500">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-emerald-700 underline hover:text-emerald-800">
          Log in
        </Link>
      </p>
    </form>
  );
}

function formatFriendlyDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
