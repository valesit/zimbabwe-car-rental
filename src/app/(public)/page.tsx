import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { SearchForm } from '@/components/SearchForm';
import { CarCard } from '@/components/CarCard';
import { hasOpenDayInHorizon, horizonEndIso } from '@/lib/availability';

export const revalidate = 60;

const HERO_IMAGE =
  'https://images.pexels.com/photos/16773464/pexels-photo-16773464.jpeg?auto=compress&cs=tinysrgb&w=1800';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: cities } = await supabase.from('cities').select('name').order('name');

  const today = new Date().toISOString().slice(0, 10);
  const horizonEnd = horizonEndIso(today);

  const { data: candidateCars } = await supabase
    .from('cars')
    .select('id, make, model, year, car_type, location_city, daily_rate_usd, image_urls, description')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(48);

  const ids = (candidateCars ?? []).map((car) => car.id);

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
    <div className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[#edf1ee] bg-white">
        <div className="mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-6 sm:pb-16 sm:pt-14 lg:px-8 lg:pb-20 lg:pt-14">
          <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8">
            <div className="relative z-10 max-w-xl lg:pb-16">
              <h1 className="font-display text-5xl font-medium leading-[0.94] tracking-[-0.052em] text-[#101815] sm:text-6xl lg:text-[5.2rem]">
                Your journey,
                <span className="block text-[#3d7a61]">our cars.</span>
              </h1>

              <p className="mt-6 max-w-lg text-base leading-7 text-[#4f5f59] sm:text-lg sm:leading-8">
                Find and book reliable cars across Zimbabwe with transparent pricing, flexible dates, and dependable local support.
              </p>

              <div className="mt-8 grid max-w-[31rem] grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  ['Inspected cars', 'shield'],
                  ['Clear pricing', 'tag'],
                  ['Flexible dates', 'calendar'],
                  ['Local support', 'support'],
                ].map(([label, icon]) => (
                  <div
                    key={label}
                    className="inline-flex items-center gap-2.5 rounded-xl border border-[#e0e6e2] bg-white px-4 py-3 text-sm font-medium text-[#33433d] shadow-[0_12px_25px_-22px_rgba(20,54,42,0.55)]"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f2f8f4] text-[#176447]">
                      {icon === 'calendar' ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      ) : icon === 'support' ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18.364 5.636a9 9 0 010 12.728M5.636 5.636a9 9 0 000 12.728M12 9v3m0 4h.01M9.172 9.172a4 4 0 115.656 5.656 4 4 0 01-5.656-5.656z" /></svg>
                      ) : icon === 'tag' ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h.01M3 11l8.586-8.586A2 2 0 0113 2h6a2 2 0 012 2v6a2 2 0 01-.586 1.414L11.828 20a2 2 0 01-2.828 0L3 14a2 2 0 010-3z" /></svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 3c-2.755 0-5.29.93-7.318 2.493A11.99 11.99 0 003 12c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-2.146-.564-4.16-1.382-6.016z" /></svg>
                      )}
                    </span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative min-h-[330px] overflow-hidden rounded-[2.25rem] border border-[#e8edea] bg-[#f4f6f4] shadow-[0_28px_70px_-38px_rgba(15,23,42,0.32)] sm:min-h-[430px] lg:min-h-[520px]">
              <Image
                src={HERO_IMAGE}
                alt="Toyota RAV4 available for car hire"
                fill
                priority
                className="scale-[1.04] object-cover"
                style={{ objectPosition: 'center 45%' }}
                sizes="(max-width: 1024px) 100vw, 56vw"
              />
              <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white/30 to-transparent sm:w-32" aria-hidden="true" />
            </div>
          </div>

          <div className="relative z-20 mt-8 lg:-mt-12">
            <div className="mx-auto max-w-6xl">
              <SearchForm cities={cities ?? undefined} />
            </div>
          </div>
        </div>
      </section>

      {/* Available cars */}
      {featuredCars.length > 0 ? (
        <section className="bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Available now</p>
                <h2 className="font-display mt-2 text-3xl font-medium tracking-[-0.03em] text-slate-950 sm:text-4xl">
                  Popular cars for your next trip
                </h2>
                <p className="mt-3 max-w-xl leading-7 text-[#52615b]">
                  Start with vehicles currently available from our Harare fleet and choose the car that fits your plans.
                </p>
              </div>
              <Link href="/listings" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800">
                View all cars <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featuredCars.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* How it works */}
      <section id="how-it-works" className="border-y border-[#edf1ee] bg-[#fbfcfb] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Simple from start to finish</p>
            <h2 className="font-display mt-2 text-3xl font-medium tracking-[-0.03em] text-slate-950 sm:text-4xl">How it works</h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              ['01', 'Search your dates', 'Tell us when you need a car and we’ll show options that fit your trip.'],
              ['02', 'Choose your car', 'Compare the available vehicles, daily price, photos, and rental details.'],
              ['03', 'Request your booking', 'Submit your booking request and keep track of the trip from your account.'],
            ].map(([step, title, copy]) => (
              <div key={step} className="rounded-2xl border border-[#e3e9e5] bg-white p-7 shadow-[0_12px_35px_-30px_rgba(15,23,42,0.3)]">
                <span className="font-display text-3xl text-emerald-700">{step}</span>
                <h3 className="mt-7 text-lg font-semibold tracking-[-0.02em] text-slate-900">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#586861]">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why us */}
      <section id="why-us" className="bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Why Rental Car Connect</p>
              <h2 className="font-display mt-2 max-w-md text-3xl font-medium tracking-[-0.03em] text-slate-950 sm:text-4xl">
                Car rental that feels straightforward.
              </h2>
              <p className="mt-5 max-w-lg leading-7 text-[#52615b]">
                We keep the experience focused on what matters: dependable cars, clear booking details, and a simple way to manage your trip.
              </p>
              <Link href="/listings" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800">
                Browse the fleet <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ['Flexible booking', 'Search by the exact dates you need and quickly see cars that fit your plans.'],
                ['Locally managed', 'A Zimbabwe-focused service designed around dependable local support and a growing fleet.'],
                ['Curated fleet', 'Every vehicle is listed and managed by our team, so the experience stays consistent.'],
              ].map(([title, copy], index) => (
                <div key={title} className="rounded-2xl border border-[#e3e9e5] bg-white p-6 shadow-[0_12px_30px_-30px_rgba(15,23,42,0.28)]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                    {index === 0 ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    ) : index === 1 ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 3c-2.755 0-5.29.93-7.318 2.493A11.99 11.99 0 003 12c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-2.146-.564-4.16-1.382-6.016z" /></svg>
                    )}
                  </div>
                  <h3 className="mt-6 font-semibold tracking-[-0.02em] text-slate-900">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#586861]">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-white px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-[2rem] border border-emerald-900/10 bg-emerald-950 px-7 py-9 text-white shadow-[0_24px_60px_-35px_rgba(6,78,59,0.65)] sm:px-10 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200">Ready when you are</p>
            <h2 className="font-display mt-2 text-3xl font-medium tracking-[-0.03em]">Ready to hit the road?</h2>
            <p className="mt-2 text-sm leading-6 text-emerald-50/75">Browse the full fleet and find the right car for your dates.</p>
          </div>
          <Link href="/listings" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-50">
            Browse all cars <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
