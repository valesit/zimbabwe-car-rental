import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatDailyRateUsd } from '@/lib/money';

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(
      `
      id, start_date, end_date, status, total_amount_usd, payment_status,
      include_pickup_dropoff, pickup_dropoff_fee_usd, refundable_deposit_charged_usd,
      cars (id, make, model, year, location_city)
    `
    )
    .eq('id', id)
    .eq('renter_id', user.id)
    .maybeSingle();

  if (error || !booking) notFound();

  const carRaw = booking.cars;
  const car = (Array.isArray(carRaw) ? carRaw[0] : carRaw) as {
    id: string;
    make: string;
    model: string;
    year: number;
    location_city: string;
  } | null;

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/80 to-white p-8 text-center shadow-lg shadow-emerald-900/5 ring-1 ring-emerald-100">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-6 font-brand text-2xl font-semibold tracking-tight text-slate-900">
          Booking confirmed
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Your payment was successful. We&apos;ve saved your trip details below.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-100">
        {car && (
          <p className="font-semibold text-slate-900">
            {car.make} {car.model} <span className="text-slate-500">({car.year})</span>
          </p>
        )}
        {car && <p className="mt-1 text-sm text-slate-600">{car.location_city}</p>}
        <p className="mt-4 text-sm text-slate-700">
          <span className="font-medium text-slate-800">Dates</span>
          <br />
          {booking.start_date} → {booking.end_date}
        </p>
        {Number(booking.pickup_dropoff_fee_usd ?? 0) > 0 && (
          <p className="mt-2 text-sm text-slate-600">
            Pick-up &amp; drop-off included ({formatDailyRateUsd(Number(booking.pickup_dropoff_fee_usd))})
          </p>
        )}
        {Number(booking.refundable_deposit_charged_usd ?? 0) > 0 && (
          <p className="mt-2 text-sm text-slate-600">
            Refundable deposit: {formatDailyRateUsd(Number(booking.refundable_deposit_charged_usd))}
          </p>
        )}
        <p className="mt-4 text-lg font-semibold text-emerald-800">
          Total paid {formatDailyRateUsd(Number(booking.total_amount_usd))}
        </p>
        {booking.payment_status === 'paid' && (
          <p className="mt-1 text-xs text-slate-500">Payment status: Paid</p>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/dashboard/bookings"
          className="inline-flex justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700"
        >
          My bookings
        </Link>
        {car && (
          <Link
            href={`/listings/${car.id}`}
            className="inline-flex justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            Back to listing
          </Link>
        )}
      </div>
    </div>
  );
}
