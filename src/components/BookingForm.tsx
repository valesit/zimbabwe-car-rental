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
import {
  computeBookingTotalUsd,
  PICKUP_DROPOFF_FEE_USD,
  totalUsd,
} from '@/lib/booking-pricing';

const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? '';

interface BookingFormProps {
  carId: string;
  dailyRate: number;
  /** Refundable security deposit for this listing (USD). */
  refundableDepositUsd: number;
  availability: AvailabilityRow[];
  nextAvailableDate: string | null;
  /** Inclusive last bookable day (YYYY-MM-DD) */
  horizonEnd: string;
  /** PayPal checkout is only shown when the visitor is signed in. */
  isLoggedIn: boolean;
}

export function BookingForm({
  carId,
  dailyRate,
  refundableDepositUsd,
  availability,
  nextAvailableDate,
  horizonEnd,
  isLoggedIn,
}: BookingFormProps) {
  const router = useRouter();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [includePickupDropoff, setIncludePickupDropoff] = useState(false);
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

  const loginRedirect = `/login?redirect=${encodeURIComponent(`/listings/${carId}`)}`;
  const signupRedirect = `/signup?redirect=${encodeURIComponent(`/listings/${carId}`)}`;

  const canPay =
    isLoggedIn &&
    Boolean(startDate && endDate) &&
    getDaysBetween(startDate, endDate) >= 1 &&
    isRangeAvailable(startDate, endDate) &&
    !loading;

  const days =
    startDate && endDate && getDaysBetween(startDate, endDate) > 0
      ? getDaysBetween(startDate, endDate)
      : 0;
  const rentSubtotal = days > 0 ? totalUsd(dailyRate, days) : 0;
  const grandTotal =
    days > 0
      ? computeBookingTotalUsd(dailyRate, days, includePickupDropoff, refundableDepositUsd)
      : 0;

  return (
    <div className="mt-4 space-y-5">
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
        <p className="mb-2 font-brand text-sm font-semibold tracking-tight text-emerald-950">
          Availability
        </p>
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

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Start date</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={todayStr}
            max={horizonEnd}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">End date</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate || todayStr}
            max={horizonEnd}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
          />
        </label>
      </div>

      {days > 0 && (
        <div className="rounded-2xl border border-emerald-100/90 bg-gradient-to-br from-white to-emerald-50/40 p-4 shadow-sm ring-1 ring-emerald-100/60">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/80">Price summary</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li className="flex justify-between gap-4">
              <span>
                Rental ({days} {days === 1 ? 'day' : 'days'})
              </span>
              <span className="font-medium text-slate-900">{formatDailyRateUsd(rentSubtotal)}</span>
            </li>
            {refundableDepositUsd > 0 && (
              <li className="flex justify-between gap-4">
                <span>Refundable deposit</span>
                <span className="font-medium text-slate-900">
                  {formatDailyRateUsd(refundableDepositUsd)}
                </span>
              </li>
            )}
            {isLoggedIn ? (
              <li className="flex items-start justify-between gap-4 border-t border-emerald-100/80 pt-3">
                <label className="flex cursor-pointer gap-2 text-left">
                  <input
                    type="checkbox"
                    checked={includePickupDropoff}
                    onChange={(e) => setIncludePickupDropoff(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    <span className="font-medium text-slate-900">Include pick-up &amp; drop-off</span>
                    <span className="mt-0.5 block text-xs font-normal text-slate-500">
                      Add {formatDailyRateUsd(PICKUP_DROPOFF_FEE_USD)} to your trip
                    </span>
                  </span>
                </label>
                <span className="shrink-0 font-medium text-slate-900">
                  {includePickupDropoff ? formatDailyRateUsd(PICKUP_DROPOFF_FEE_USD) : '—'}
                </span>
              </li>
            ) : (
              <li className="border-t border-emerald-100/80 pt-3 text-xs text-slate-500">
                Log in to add pick-up &amp; drop-off ({formatDailyRateUsd(PICKUP_DROPOFF_FEE_USD)}).
              </li>
            )}
          </ul>
          <p className="mt-4 flex items-baseline justify-between border-t border-emerald-100/90 pt-3">
            <span className="text-sm font-semibold text-emerald-950">Total due at checkout</span>
            <span className="text-lg font-bold tracking-tight text-emerald-800">
              {formatDailyRateUsd(grandTotal)}
            </span>
          </p>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!isLoggedIn && paypalClientId ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-4 text-center">
          <p className="text-sm font-medium text-emerald-900">Log in to book and pay with PayPal</p>
          <p className="mt-2 text-xs text-emerald-800/90">
            Choose your dates above, then sign in to complete your booking.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href={loginRedirect}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700"
            >
              Log in
            </Link>
            <Link
              href={signupRedirect}
              className="inline-flex items-center justify-center rounded-xl border border-emerald-300 bg-white px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
            >
              Sign up
            </Link>
          </div>
        </div>
      ) : isLoggedIn && paypalClientId ? (
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
            forceReRender={[canPay, startDate, endDate, includePickupDropoff]}
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
                    includePickupDropoff,
                  }),
                });
                const data = (await res.json()) as { orderID?: string; error?: string };
                if (res.status === 401) {
                  router.push(loginRedirect);
                  throw new Error('Please sign in to continue.');
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
                const id = payload.bookingId;
                if (id) {
                  router.push(`/dashboard/bookings/confirmation/${id}`);
                } else {
                  router.push('/dashboard/bookings');
                }
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
