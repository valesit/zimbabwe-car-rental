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

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: bookings }, { data: recommendedCars }] = await Promise.all([
    supabase.from('profiles').select('display_name').eq('id', user.id).maybeSingle(),
    supabase
      .from('bookings')
      .select(
        `
        id, start_date, end_date, status, total_amount_usd, car_id,
        cars (id, make, model, year, image_urls, daily_rate_usd, location_city, car_type)
      `,
      )
      .eq('renter_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('cars')
      .select('id, make, model, year, car_type, location_city, daily_rate_usd, image_urls, description')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(3),
  ]);

  const rows = bookings ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = rows
    .filter((booking) => ['pending', 'confirmed'].includes(booking.status) && booking.end_date >= today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
  const completed = rows.filter((booking) => booking.status === 'completed');
  const totalSpent = rows
    .filter((booking) => booking.status !== 'cancelled')
    .reduce((sum, booking) => sum + Number(booking.total_amount_usd ?? 0), 0);

  const firstName = profile?.display_name?.trim().split(/\s+/)[0];
  const nextTrip = upcoming[0];

  return (
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Your rental experience</p>
          <h1 className="font-display mt-2 text-4xl font-medium tracking-[-0.035em] text-slate-950 sm:text-5xl">
            {firstName ? `Welcome back, ${firstName}.` : 'Welcome back.'}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Keep track of upcoming trips, revisit past rentals and find your next car from one place.
          </p>
        </div>
        <Link
          href="/listings"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-950"
        >
          Browse cars <span aria-hidden>→</span>
        </Link>
      </header>

      <section className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Upcoming" value={String(upcoming.length)} detail="Trips ahead" />
        <MetricCard label="Completed" value={String(completed.length)} detail="Trips enjoyed" />
        <MetricCard label="Total rentals" value={String(rows.length)} detail="All booking requests" />
        <MetricCard label="Rental spend" value={formatDailyRateUsd(totalSpent)} detail="Across non-cancelled trips" />
      </section>

      <section className="mt-9 grid gap-6 xl:grid-cols-[1.6fr_0.8fr]">
        <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_20px_50px_-38px_rgba(15,23,42,0.45)]">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:px-7">
            <div>
              <h2 className="font-display text-2xl font-medium tracking-[-0.02em] text-slate-950">Upcoming trips</h2>
              <p className="mt-1 text-sm text-slate-500">Everything you need before you pick up the keys.</p>
            </div>
            <Link href="/dashboard/bookings" className="text-sm font-semibold text-emerald-800 hover:text-emerald-950">
              View all
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <div className="px-6 py-12 text-center sm:px-8">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
                <CarIcon className="h-6 w-6" />
              </div>
              <h3 className="font-display mt-5 text-2xl font-medium text-slate-950">No upcoming trips yet.</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Choose a car and your dates when you are ready for your next journey.
              </p>
              <Link
                href="/listings"
                className="mt-6 inline-flex rounded-xl bg-emerald-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-950"
              >
                Find a car
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {upcoming.slice(0, 3).map((booking) => {
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
                const imageUrl = car
                  ? carListingImageUrl({ image_urls: car.image_urls, car_type: car.car_type ?? 'other' })
                  : null;

                return (
                  <article key={booking.id} className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-7">
                    <div className="relative h-32 w-full overflow-hidden rounded-2xl bg-slate-100 sm:h-28 sm:w-40 sm:shrink-0">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={`${car?.make ?? 'Rental'} ${car?.model ?? 'car'}`}
                          fill
                          className="object-cover"
                          sizes="160px"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-950">
                          {car?.make} {car?.model} {car?.year ? `(${car.year})` : ''}
                        </h3>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ${statusBadge(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        {formatDate(booking.start_date)} <span className="mx-1 text-slate-300">→</span> {formatDate(booking.end_date)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{car?.location_city ?? 'Harare'}</p>
                    </div>
                    <div className="flex shrink-0 flex-row items-center justify-between gap-4 sm:flex-col sm:items-end">
                      <p className="font-semibold text-emerald-900">{formatDailyRateUsd(Number(booking.total_amount_usd))}</p>
                      <Link
                        href={`/dashboard/bookings/${booking.id}`}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-900"
                      >
                        View trip
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <aside className="relative overflow-hidden rounded-3xl bg-emerald-950 p-7 text-white shadow-[0_22px_55px_-35px_rgba(6,78,59,0.6)]">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border border-white/10" aria-hidden="true" />
          <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full border border-white/10" aria-hidden="true" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.17em] text-emerald-200">Plan another trip</p>
            <h2 className="font-display mt-3 text-3xl font-medium leading-tight">Need a car soon?</h2>
            <p className="mt-3 text-sm leading-6 text-emerald-50/80">
              Browse the latest available vehicles and choose dates that work for you.
            </p>
            {nextTrip ? (
              <div className="mt-7 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-100/70">Next trip</p>
                <p className="mt-2 text-sm font-semibold text-white">{formatDate(nextTrip.start_date)}</p>
                <p className="mt-1 text-xs text-emerald-50/70">Your next rental is already on the calendar.</p>
              </div>
            ) : null}
            <Link
              href="/listings"
              className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-50"
            >
              Explore the fleet
            </Link>
          </div>
        </aside>
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Available now</p>
            <h2 className="font-display mt-2 text-3xl font-medium tracking-[-0.025em] text-slate-950">Recommended for you</h2>
          </div>
          <Link href="/listings" className="hidden text-sm font-semibold text-emerald-800 hover:text-emerald-950 sm:block">
            View all cars →
          </Link>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {(recommendedCars ?? []).map((car) => (
            <Link
              key={car.id}
              href={`/listings/${car.id}`}
              className="group overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_18px_45px_-38px_rgba(15,23,42,0.5)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_50px_-35px_rgba(15,23,42,0.5)]"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                <Image
                  src={carListingImageUrl(car)}
                  alt={`${car.make} ${car.model}`}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="p-5">
                <p className="font-semibold text-slate-950">{car.make} {car.model} ({car.year})</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-500">{car.location_city}</span>
                  <span className="font-semibold text-emerald-900">{formatDailyRateUsd(Number(car.daily_rate_usd))}<span className="text-xs font-medium text-slate-400"> / day</span></span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white px-5 py-5 shadow-[0_16px_40px_-36px_rgba(15,23,42,0.5)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="font-display mt-2 text-3xl font-medium tracking-[-0.03em] text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function CarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M5 16h14M6 16v2m12-2v2M4 12l2-5h12l2 5v4H4v-4Zm3 1h.01M17 13h.01" />
    </svg>
  );
}

function formatDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
