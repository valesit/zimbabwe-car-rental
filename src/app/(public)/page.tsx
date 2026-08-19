import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { hasOpenDayInHorizon, horizonEndIso } from '@/lib/availability';
import { carListingImageUrl } from '@/lib/carImages';
import { formatDailyRateUsd } from '@/lib/money';
import { CAR_TYPE_LABELS, type CarType } from '@/types/database';

export const revalidate = 60;

const HERO_IMAGE = 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1600&q=80';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: cities } = await supabase.from('cities').select('name').order('name');

  const today = new Date().toISOString().slice(0, 10);
  const horizonEnd = horizonEndIso(today);

  const { data: candidateCars } = await supabase
    .from('cars')
    .select('id, make, model, year, car_type, location_city, daily_rate_usd, image_urls')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(16);

  const ids = (candidateCars ?? []).map((c) => c.id);

  let featuredCars: NonNullable<typeof candidateCars> = [];
  if (ids.length > 0) {
    const { data: blockedRows } = await supabase
      .from('car_availability')
      .select('car_id, available_date')
      .in('car_id', ids)
      .gte('available_date', today)
      .lte('available_date', horizonEnd)
      .eq('is_available', false);

    const blockedByCar = new Map<string, Set<string>>();
    for (const row of blockedRows ?? []) {
      if (!blockedByCar.has(row.car_id)) blockedByCar.set(row.car_id, new Set());
      blockedByCar.get(row.car_id)!.add(row.available_date);
    }

    featuredCars = (candidateCars ?? [])
      .filter((car) =>
        hasOpenDayInHorizon(today, horizonEnd, blockedByCar.get(car.id) ?? new Set())
      )
      .slice(0, 4);
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#f4f8f6] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-[0_14px_45px_rgba(15,118,110,0.08)]">
        <section className="relative px-8 pb-14 pt-10 sm:px-10 lg:px-12 lg:pb-16 lg:pt-12">
          <div className="absolute inset-y-0 right-0 hidden w-[57%] lg:block">
            <Image src={HERO_IMAGE} alt="Car in Harare" fill className="object-cover" sizes="57vw" priority />
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/5" />
          </div>
          <div className="relative max-w-xl">
            <h1 className="max-w-[10ch] text-balance font-serif text-5xl font-semibold leading-[1.06] tracking-tight text-slate-900 sm:text-6xl">
              Your journey, <span className="text-emerald-700">our cars.</span>
            </h1>
            <p className="mt-4 max-w-md text-lg text-slate-700">
              Find and book reliable cars in Harare from trusted local owners.
            </p>
          </div>

          <form
            action="/listings"
            method="get"
            className="relative mt-10 grid gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur sm:grid-cols-2 lg:grid-cols-12"
          >
            <Field label="Start date" className="lg:col-span-2">
              <input type="date" name="start" className={fieldClass} />
            </Field>
            <Field label="End date" className="lg:col-span-2">
              <input type="date" name="end" className={fieldClass} />
            </Field>
            <Field label="City" className="lg:col-span-2">
              <select name="city" className={fieldClass}>
                <option value="">Any</option>
                {(cities ?? []).map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Car type" className="lg:col-span-2">
              <select name="type" className={fieldClass}>
                <option value="">Any</option>
                {Object.entries(CAR_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex items-end sm:col-span-2 lg:col-span-2">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
              >
                Search cars
              </button>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap gap-2.5 text-sm">
            <TrustPill label="Verified cars" />
            <TrustPill label="Trusted owners" />
            <TrustPill label="Flexible dates" />
            <TrustPill label="24/7 support" />
          </div>
        </section>

        <section className="px-8 pb-10 sm:px-10 lg:px-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-3xl font-semibold text-slate-900">Popular cars in Harare</h2>
            <Link href="/listings" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
              View all cars →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {featuredCars.length === 0 ? (
              <p className="col-span-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-slate-600">
                No cars available yet. Add your first listing from the dashboard.
              </p>
            ) : (
              featuredCars.map((car, idx) => {
                const rating = (4.6 + (idx % 3) * 0.1).toFixed(1);
                const image = carListingImageUrl({ image_urls: car.image_urls as string[], car_type: car.car_type });
                return (
                  <Link
                    key={car.id}
                    href={`/listings/${car.id}`}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="relative h-40">
                      <Image src={image} alt={`${car.make} ${car.model}`} fill className="object-cover" sizes="25vw" />
                      <span className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow">
                        ♡
                      </span>
                    </div>
                    <div className="space-y-1 px-4 py-3">
                      <p className="font-semibold text-slate-900">
                        {car.make} {car.model} ({car.year})
                      </p>
                      <p className="text-sm text-slate-500">{CAR_TYPE_LABELS[car.car_type as CarType] ?? car.car_type}</p>
                      <div className="flex items-center justify-between text-sm">
                        <p className="font-semibold text-emerald-700">{formatDailyRateUsd(Number(car.daily_rate_usd))} / day</p>
                        <p className="font-semibold text-amber-500">★ {rating}</p>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        <section id="how-it-works" className="border-t border-slate-200 px-8 py-12 sm:px-10 lg:px-12">
          <h3 className="text-center font-serif text-4xl font-semibold text-slate-900">Why book with us</h3>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <FeatureCard
              title="Flexible dates"
              body="Choose the start and end dates that work for you. Change or extend easily."
              icon="📅"
            />
            <FeatureCard
              title="Harare-focused"
              body="Curated selection of cars across Harare with convenient pickup locations."
              icon="📍"
            />
            <FeatureCard
              title="Verified owners"
              body="All cars are verified and listed by trusted owners for your peace of mind."
              icon="🛡️"
            />
          </div>
          <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 sm:p-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="font-serif text-3xl font-semibold text-slate-900">Ready to hit the road?</p>
                <p className="mt-1 text-slate-600">Browse our full collection of reliable cars in Harare.</p>
              </div>
              <Link
                href="/listings"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                Browse all cars →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className ?? ''}`}>
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function TrustPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm">
      {label}
    </span>
  );
}

function FeatureCard({ title, body, icon }: { title: string; body: string; icon: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <span className="text-2xl" aria-hidden>
        {icon}
      </span>
      <p className="mt-2 font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{body}</p>
    </div>
  );
}

const fieldClass =
  'h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20';
