'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { formatDailyRateUsd } from '@/lib/money';
import { AvailabilityCalendar, type AvailabilityRow } from '@/components/AvailabilityCalendar';
import { buildBlockedSet, isRangeEntirelyOpen, toISODateLocal } from '@/lib/availability';
import { computeBookingTotalUsd, PICKUP_DROPOFF_FEE_USD, totalUsd } from '@/lib/booking-pricing';

const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? '';

interface BookingFormProps {
  carId: string;
  dailyRate: number;
  refundableDepositUsd: number;
  availability: AvailabilityRow[];
  nextAvailableDate: string | null;
  horizonEnd: string;
  isLoggedIn: boolean;
  initialStartDate?: string;
  initialEndDate?: string;
}

export function BookingForm({
  carId,
  dailyRate,
  refundableDepositUsd,
  availability,
  nextAvailableDate,
  horizonEnd,
  isLoggedIn,
  initialStartDate,
  initialEndDate,
}: BookingFormProps) {
  const router = useRouter();
  const blockedSet = useMemo(() => buildBlockedSet(availability), [availability]);
  const todayStr = useMemo(() => toISODateLocal(new Date()), []);
  const initialRange = useMemo(() => {
    if (!initialStartDate || !initialEndDate) return { start: '', end: '' };
    if (!isRangeEntirelyOpen(initialStartDate, initialEndDate, todayStr, horizonEnd, blockedSet)) {
      return { start: '', end: '' };
    }
    return { start: initialStartDate, end: initialEndDate };
  }, [initialStartDate, initialEndDate, todayStr, horizonEnd, blockedSet]);

  const [startDate, setStartDate] = useState(initialRange.start);
  const [endDate, setEndDate] = useState(initialRange.end);
  const [includePickupDropoff, setIncludePickupDropoff] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getDaysBetween(start: string, end: string): number {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
  }

  function isRangeAvailable(start: string, end: string): boolean {
    return isRangeEntirelyOpen(start, end, todayStr, horizonEnd, blockedSet);
  }

  const returnParams = new URLSearchParams();
  if (startDate) returnParams.set('start', startDate);
  if (endDate) returnParams.set('end', endDate);
  const returnQuery = returnParams.toString();
  const returnPath = `/listings/${carId}${returnQuery ? `?${returnQuery}` : ''}`;
  const loginRedirect = `/login?redirect=${encodeURIComponent(returnPath)}`;
  const signupRedirect = `/signup?redirect=${encodeURIComponent(returnPath)}`;

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
  const isUsingSearchDates =
    Boolean(initialRange.start && initialRange.end) &&
    startDate === initialRange.start &&
    endDate === initialRange.end;

  const inputClass =
    'mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10';

  return (
    <div className="mt-5 space-y-5">
      {isUsingSearchDates ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3">
          <p className="text-sm font-semibold text-emerald-950">Your search dates are already selected.</p>
          <p className="mt-1 text-xs leading-5 text-emerald-900/70">
            {formatFriendlyDate(startDate)} → {formatFriendlyDate(endDate)}. You can adjust them below if your plans change.
          </p>
        </div>
      ) : nextAvailableDate ? (
        <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          <span className="font-semibold">Next available:</span> {formatFriendlyDate(nextAvailableDate)}
        </p>
      ) : (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          No open dates are showing in the current booking window. Contact support and we will help you find an alternative.
        </p>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-900">{isUsingSearchDates ? 'Your dates' : 'Choose your dates'}</p>
          <p className="text-xs text-slate-400">Available dates only</p>
        </div>
        <AvailabilityCalendar
          availability={availability}
          horizonEnd={horizonEnd}
          startDate={startDate}
          endDate={endDate}
          initialVisibleMonth={startDate || nextAvailableDate}
          onRangeChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
            setError(null);
          }}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Pick-up</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={todayStr}
            max={horizonEnd}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Return</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate || todayStr}
            max={horizonEnd}
            className={inputClass}
          />
        </label>
      </div>

      {days > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Price summary</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li className="flex justify-between gap-4">
              <span>Rental ({days} {days === 1 ? 'day' : 'days'})</span>
              <span className="font-semibold text-slate-900">{formatDailyRateUsd(rentSubtotal)}</span>
            </li>
            {refundableDepositUsd > 0 ? (
              <li className="flex justify-between gap-4">
                <span>Refundable deposit</span>
                <span className="font-semibold text-slate-900">{formatDailyRateUsd(refundableDepositUsd)}</span>
              </li>
            ) : null}
            {isLoggedIn ? (
              <li className="border-t border-slate-200 pt-3">
                <label className="flex cursor-pointer items-start justify-between gap-4">
                  <span className="flex gap-2.5">
                    <input
                      type="checkbox"
                      checked={includePickupDropoff}
                      onChange={(e) => setIncludePickupDropoff(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-emerald-300 text-emerald-700 focus:ring-emerald-500"
                    />
                    <span>
                      <span className="font-medium text-slate-900">Pick-up &amp; drop-off service</span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        Add {formatDailyRateUsd(PICKUP_DROPOFF_FEE_USD)} to your trip
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold text-slate-900">
                    {includePickupDropoff ? formatDailyRateUsd(PICKUP_DROPOFF_FEE_USD) : '—'}
                  </span>
                </label>
              </li>
            ) : (
              <li className="border-t border-slate-200 pt-3 text-xs text-slate-500">
                Sign in to add pick-up &amp; drop-off service ({formatDailyRateUsd(PICKUP_DROPOFF_FEE_USD)}).
              </li>
            )}
          </ul>
          <div className="mt-4 flex items-baseline justify-between border-t border-slate-200 pt-4">
            <span className="text-sm font-semibold text-slate-900">Total due at checkout</span>
            <span className="font-display text-2xl font-medium text-emerald-950">{formatDailyRateUsd(grandTotal)}</span>
          </div>
        </div>
      ) : null}

      {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      {!isLoggedIn && paypalClientId ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-center">
          <p className="font-semibold text-emerald-950">Sign in to complete your booking</p>
          <p className="mt-1.5 text-xs leading-5 text-emerald-900/70">Your selected dates will be kept when you sign in to pay securely with PayPal.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Link
              href={loginRedirect}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-950"
            >
              Sign in
            </Link>
            <Link
              href={signupRedirect}
              className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50"
            >
              Create account
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
                router.push(id ? `/dashboard/bookings/confirmation/${id}` : '/dashboard/bookings');
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
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Online checkout is temporarily unavailable. <Link href="/support" className="font-semibold underline">Contact support</Link> for help with this booking.
        </div>
      )}

      {loading ? <p className="text-center text-sm text-slate-500">Processing…</p> : null}
    </div>
  );
}

function formatFriendlyDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}