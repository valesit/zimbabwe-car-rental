'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface AvailabilityRow {
  available_date: string;
  is_available: boolean;
}

interface BookingFormProps {
  carId: string;
  dailyRate: number;
  availability: AvailabilityRow[];
}

export function BookingForm({ carId, dailyRate, availability }: BookingFormProps) {
  const router = useRouter();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableSet = new Set(
    availability.filter((a) => a.is_available).map((a) => a.available_date)
  );

  function getDaysBetween(start: string, end: string): number {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
  }

  function isRangeAvailable(start: string, end: string): boolean {
    if (!start || !end) return false;
    const days: string[] = [];
    for (let d = new Date(start); d <= new Date(end); d.setDate(d.getDate() + 1)) {
      days.push(d.toISOString().slice(0, 10));
    }
    return days.every((day) => availableSet.has(day));
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
      setError('Selected dates are not fully available.');
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
      total_amount_zwl: total,
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
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Start date</span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          min={new Date().toISOString().slice(0, 10)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">End date</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          min={startDate || new Date().toISOString().slice(0, 10)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </label>
      {startDate && endDate && getDaysBetween(startDate, endDate) > 0 && (
        <p className="text-sm text-gray-600">
          {getDaysBetween(startDate, endDate)} days · ZWL {(dailyRate * getDaysBetween(startDate, endDate)).toLocaleString()} total
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? 'Booking...' : 'Request to book'}
      </button>
      <p className="text-center text-xs text-gray-500">
        Already have an account? <Link href="/login" className="underline">Log in</Link>
      </p>
    </form>
  );
}
