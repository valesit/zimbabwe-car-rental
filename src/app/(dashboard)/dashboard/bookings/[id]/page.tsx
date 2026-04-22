import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatDailyRateUsd } from '@/lib/money';
import { LeaveReviewForm } from '@/components/LeaveReviewForm';

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id, start_date, end_date, status, total_amount_usd,
      include_pickup_dropoff, pickup_dropoff_fee_usd, refundable_deposit_charged_usd,
      car_id, renter_id,
      cars (id, make, model, year, location_city, owner_id)
    `)
    .eq('id', id)
    .single();

  if (error || !booking || booking.renter_id !== user.id) notFound();

  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('booking_id', id)
    .single();

  const carRaw = booking.cars;
  const car = (Array.isArray(carRaw) ? carRaw[0] : carRaw) as { id: string; make: string; model: string; year: number; location_city: string; owner_id: string };
  const canReview = booking.status === 'completed' && !existingReview;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard/bookings" className="text-sm font-medium text-emerald-700 hover:underline">
        ← My bookings
      </Link>
      <h1 className="mt-4 font-brand text-3xl font-semibold tracking-tight text-slate-900">Booking details</h1>
      <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <p className="text-lg font-semibold text-slate-900">
          {car.make} {car.model} ({car.year})
        </p>
        <p className="text-sm text-slate-700">{car.location_city}</p>
        <p className="mt-3 text-slate-800">
          {booking.start_date} – {booking.end_date}
        </p>
        <p className="mt-2 capitalize text-slate-800">
          Status: <span className="font-semibold">{booking.status}</span>
        </p>
        <div className="mt-3 space-y-1 text-sm text-slate-700">
          {Number(booking.pickup_dropoff_fee_usd ?? 0) > 0 && (
            <p>Pick-up &amp; drop-off: {formatDailyRateUsd(Number(booking.pickup_dropoff_fee_usd))}</p>
          )}
          {Number(booking.refundable_deposit_charged_usd ?? 0) > 0 && (
            <p>
              Refundable deposit (charged):{' '}
              {formatDailyRateUsd(Number(booking.refundable_deposit_charged_usd))}
            </p>
          )}
        </div>
        <p className="mt-3 text-lg font-semibold text-emerald-800">
          Total paid: {formatDailyRateUsd(Number(booking.total_amount_usd))}
        </p>
        <Link
          href={`/listings/${car.id}`}
          className="mt-5 inline-block text-sm font-semibold text-emerald-700 hover:underline"
        >
          View listing →
        </Link>
      </div>
      {canReview && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-slate-800">Leave a review</h2>
          <LeaveReviewForm
            bookingId={id}
            revieweeId={car.owner_id}
          />
        </div>
      )}
    </div>
  );
}
