import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatDailyRateUsd } from '@/lib/money';
import { carListingImageUrl } from '@/lib/carImages';
import { LeaveReviewForm } from '@/components/LeaveReviewForm';

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-800 ring-amber-200',
    confirmed: 'bg-sky-50 text-sky-800 ring-sky-200',
    completed: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    cancelled: 'bg-slate-100 text-slate-600 ring-slate-200',
  };
  return map[status] ?? 'bg-slate-100 text-slate-700 ring-slate-200';
}

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id, start_date, end_date, status, total_amount_usd,
      include_pickup_dropoff, pickup_dropoff_fee_usd, refundable_deposit_charged_usd,
      car_id, renter_id,
      cars (id, make, model, year, location_city, location_detail, owner_id, image_urls, car_type)
    `)
    .eq('id', id)
    .single();

  if (error || !booking || booking.renter_id !== user.id) notFound();

  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('booking_id', id)
    .maybeSingle();

  const carRaw = booking.cars;
  const car = (Array.isArray(carRaw) ? carRaw[0] : carRaw) as {
    id: string;
    make: string;
    model: string;
    year: number;
    location_city: string;
    location_detail?: string | null;
    owner_id: string;
    image_urls?: string[] | null;
    car_type?: string;
  };
  const canReview = booking.status === 'completed' && !existingReview;
  const heroImage = carListingImageUrl({ image_urls: car.image_urls, car_type: car.car_type ?? 'other' });

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/dashboard/bookings" className="text-sm font-semibold text-emerald-800 hover:text-emerald-950">
        ← My bookings
      </Link>

      <header className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Booking details</p>
          <h1 className="font-display mt-2 text-4xl font-medium tracking-[-0.035em] text-slate-950 sm:text-5xl">
            {car.make} {car.model}
          </h1>
          <p className="mt-2 text-slate-500">Booking #{String(booking.id).slice(0, 8).toUpperCase()}</p>
        </div>
        <span className={`inline-flex self-start rounded-full px-3 py-1.5 text-xs font-semibold capitalize ring-1 sm:self-auto ${statusBadge(booking.status)}`}>
          {booking.status}
        </span>
      </header>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_20px_50px_-40px_rgba(15,23,42,0.5)]">
          <div className="relative aspect-[16/8] bg-slate-100">
            <Image
              src={heroImage}
              alt={`${car.make} ${car.model}`}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 65vw"
            />
          </div>
          <div className="p-6 sm:p-8">
            <div className="grid gap-5 sm:grid-cols-3">
              <Detail label="Pick-up" value={formatDate(booking.start_date)} />
              <Detail label="Return" value={formatDate(booking.end_date)} />
              <Detail label="Location" value={car.location_city} />
            </div>
            {car.location_detail ? (
              <p className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Pick-up area: <span className="font-medium text-slate-800">{car.location_detail}</span>
              </p>
            ) : null}
            <Link
              href={`/listings/${car.id}`}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-950"
            >
              View vehicle details <span aria-hidden>→</span>
            </Link>
          </div>
        </div>

        <aside className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.5)] sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Payment summary</p>
          <div className="mt-5 space-y-4 text-sm">
            {Number(booking.pickup_dropoff_fee_usd ?? 0) > 0 ? (
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <p className="font-medium text-slate-800">Pick-up &amp; drop-off</p>
                  <p className="mt-1 text-xs text-slate-500">Added to this booking</p>
                </div>
                <span className="font-semibold text-slate-900">
                  {formatDailyRateUsd(Number(booking.pickup_dropoff_fee_usd))}
                </span>
              </div>
            ) : null}
            {Number(booking.refundable_deposit_charged_usd ?? 0) > 0 ? (
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <p className="font-medium text-slate-800">Refundable deposit</p>
                  <p className="mt-1 text-xs text-slate-500">Subject to rental terms</p>
                </div>
                <span className="font-semibold text-slate-900">
                  {formatDailyRateUsd(Number(booking.refundable_deposit_charged_usd))}
                </span>
              </div>
            ) : null}
            <div className="flex items-baseline justify-between gap-4 pt-1">
              <span className="font-semibold text-slate-900">Total paid</span>
              <span className="font-display text-3xl font-medium text-emerald-900">
                {formatDailyRateUsd(Number(booking.total_amount_usd))}
              </span>
            </div>
          </div>

          <div className="mt-7 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-950">
            <p className="font-semibold">Need help with this trip?</p>
            <p className="mt-1 leading-6 text-emerald-900/75">Our support team can help with booking or pick-up questions.</p>
            <Link href="/support" className="mt-3 inline-flex font-semibold hover:underline">Contact support →</Link>
          </div>
        </aside>
      </section>

      {canReview ? (
        <section className="mt-8 rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.5)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">After your trip</p>
          <h2 className="font-display mt-2 text-3xl font-medium tracking-[-0.025em] text-slate-950">Share your rental experience</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Your feedback helps us maintain a reliable fleet and a better experience for future renters.</p>
          <LeaveReviewForm bookingId={id} revieweeId={car.owner_id} />
        </section>
      ) : null}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1.5 font-medium text-slate-900">{value}</p>
    </div>
  );
}

function formatDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
