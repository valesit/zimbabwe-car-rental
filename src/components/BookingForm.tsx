'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { formatDailyRateUsd } from '@/lib/money';
import { AvailabilityCalendar, type AvailabilityRow } from '@/components/AvailabilityCalendar';
import {
  buildBlockedSet,
  isRangeEntirelyOpen,
  toISODateLocal,
} from '@/lib/availability';

const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? '';

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

  const canPay =
    Boolean(startDate && endDate) &&
    getDaysBetween(startDate, endDate) >= 1 &&
    isRangeAvailable(startDate, endDate) &&
    !loading;

  return (
    <div className="mt-4 space-y-4">
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

      {paypalClientId ? (
        <PayPalScriptProvider
          options={{
            clientId: paypalClientId,
            currency: 'USD',
            intent: 'capture',
          }}
        >
          <PayPalButtons
            style={{ layout: 'vertical', shape: 'rect', label: 'paypal' }}
            disabled={!canPay}
            forceReRender={[canPay, startDate, endDate]}
            createOrder={async () => {
              setError(null);
              setLoading(true);
              try {
                const res = await fetch('/api/paypal/create-order', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    carId,
                    startDate,
                    endDate,
                  }),
                });
                const data = (await res.json()) as { orderID?: string; error?: string };
                if (res.status === 401) {
                  router.push(`/login?redirect=/listings/${carId}`);
                  throw new Error('Please sign in to pay.');
                }
                if (!res.ok || !data.orderID) {
                  throw new Error(data.error ?? 'Could not start checkout.');
                }
                return data.orderID;
              } finally {
                setLoading(false);
              }
            }}
            onApprove={async (data) => {
              setError(null);
              setLoading(true);
              try {
                const res = await fetch('/api/paypal/capture-order', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ orderID: data.orderID }),
                });
                const payload = (await res.json()) as { bookingId?: string; error?: string };
                if (!res.ok) {
                  throw new Error(payload.error ?? 'Payment could not be completed.');
                }
                router.push('/dashboard');
                router.refresh();
              } finally {
                setLoading(false);
              }
            }}
            onError={() => {
              setError('PayPal encountered an error. Try again.');
              setLoading(false);
            }}
          />
        </PayPalScriptProvider>
      ) : (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Online checkout is not configured. Set{' '}
          <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> and server-side
          PayPal variables in the environment.
        </p>
      )}

      {loading && (
        <p className="text-center text-sm text-gray-600">Processing…</p>
      )}

      <p className="text-center text-xs text-gray-500">
        You will pay with PayPal first; your booking is saved after payment succeeds. Already have an
        account?{' '}
        <Link href="/login" className="font-medium text-emerald-700 underline hover:text-emerald-800">
          Log in
        </Link>
      </p>
    </div>
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
