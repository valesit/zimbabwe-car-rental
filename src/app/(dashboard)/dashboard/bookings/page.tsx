import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatDailyRateUsd } from '@/lib/money';
import { carListingImageUrl } from '@/lib/carImages';

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-800 ring-amber-200',
    confirmed: 'bg-sky-50 text-sky-800 ring-sky-200',
    completed: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    cancelled: 'bg-slate-100 text-slate-600 ring-slate-200',
  };
  return map[status] ?? 'bg-slate-100 text-slate-700 ring-slate-200';
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const view = params?.view ?? 'upcoming';
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: bookings } = await supabase
    .from('bookings')
    .select(
      `
      id, start_date, end_date, status, total_amount_usd, car_id,
      cars (id, make, model, year, image_urls, location_city, car_type)
    `,
    )
    .eq('renter_id', user.id)
    .order('created_at', { ascending: false });

  const allBookings = bookings ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const filtered = allBookings.filter((booking) => {
    if (view === 'all') return true;
    if (view === 'completed') return booking.status === 'completed';
    if (view === 'cancelled') return booking.status === 'cancelled';
    return ['pending', 'confirmed'].includes(booking.status) && booking.end_date >= today;
  });

  const tabs = [
    { label: 'Upcoming', value: 'upcoming' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'All trips', value: 'all' },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/dashboard" className="text-sm font-semibold text-emerald-800 hover:text-emerald-950">
            ← Overview
          </Link>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Your trips</p>
          <h1 className="font-display mt-2 text-4xl font-medium tracking-[-0.035em] text-slate-950 sm:text-5xl">My bookings</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Review upcoming rentals, revisit completed trips and keep every booking detail close at hand.
          </p>
        </div>
        <Link
          href="/listings"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-950"
        >
          Book another car <span aria-hidden>→</span>
        </Link>
      </header>

      <nav className="mt-8 flex flex-wrap gap-2 border-b border-slate-200/80 pb-4" aria-label="Booking views">
        {tabs.map((tab) => {
          const active = view === tab.value;
          const href = tab.value === 'upcoming' ? '/dashboard/bookings' : `/dashboard/bookings?view=${tab.value}`;
          return (
            <Link
              key={tab.value}
              href={href}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                active
                  ? 'bg-emerald-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:text-emerald-900'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <section className="mt-7 space-y-5">
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 px-6 py-16 text-center shadow-[0_18px_45px_-40px_rgba(15,23,42,0.4)]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M5 16h14M6 16v2m12-2v2M4 12l2-5h12l2 5v4H4v-4Zm3 1h.01M17 13h.01" />
              </svg>
            </div>
            <h2 className="font-display mt-5 text-2xl font-medium text-slate-950">Nothing here yet.</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {view === 'upcoming'
                ? 'You do not have an upcoming rental. Browse the fleet when you are ready for your next trip.'
                : `You do not have any ${view === 'all' ? '' : view} bookings to show.`}
            </p>
            <Link
              href="/listings"
              className="mt-6 inline-flex rounded-xl bg-emerald-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-950"
            >
              Browse cars
            </Link>
          </div>
        ) : (
          filtered.map((booking) => {
            const rawCar = booking.cars;
            const car = (Array.isArray(rawCar) ? rawCar[0] : rawCar) as {
              id?: string;
              make?: string;
              model?: string;
              year?: number;
              image_urls?: string[] | null;
              location_city?: string;
              car_type?: string;
            } | null;
            const imageUrl = carListingImageUrl({
              image_urls: car?.image_urls,
              car_type: car?.car_type ?? 'other',
            });

            return (
              <article
                key={booking.id}
                className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_20px_50px_-40px_rgba(15,23,42,0.5)]"
              >
                <div className="grid md:grid-cols-[240px_1fr_auto] md:items-stretch">
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 md:aspect-auto md:min-h-[190px]">
                    <Image
                      src={imageUrl}
                      alt={`${car?.make ?? 'Rental'} ${car?.model ?? 'car'}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 240px"
                    />
                  </div>
                  <div className="p-6 sm:p-7">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-2xl font-medium tracking-[-0.02em] text-slate-950">
                        {car?.make} {car?.model}
                      </h2>
                      {car?.year ? <span className="text-sm text-slate-400">{car.year}</span> : null}
                    </div>
                    <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ${statusBadge(booking.status)}`}>
                      {booking.status}
                    </span>
                    <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Pick-up</p>
                        <p className="mt-1 font-medium text-slate-800">{formatDate(booking.start_date)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Return</p>
                        <p className="mt-1 font-medium text-slate-800">{formatDate(booking.end_date)}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-slate-500">{car?.location_city ?? 'Harare'}</p>
                  </div>
                  <div className="flex flex-row items-center justify-between gap-4 border-t border-slate-100 p-6 md:min-w-[190px] md:flex-col md:items-end md:justify-center md:border-l md:border-t-0 md:p-7">
                    <div className="md:text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Total</p>
                      <p className="mt-1 text-lg font-semibold text-emerald-900">{formatDailyRateUsd(Number(booking.total_amount_usd))}</p>
                    </div>
                    <Link
                      href={`/dashboard/bookings/${booking.id}`}
                      className="inline-flex justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-900 hover:text-white"
                    >
                      View details
                    </Link>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>
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
