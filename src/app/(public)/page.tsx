import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { SearchForm } from '@/components/SearchForm';
import { HomePromoBanner } from '@/components/HomePromoBanner';
import { CarCard } from '@/components/CarCard';
import { hasOpenDayInHorizon, horizonEndIso } from '@/lib/availability';

export const revalidate = 60;

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
      .filter((car) => hasOpenDayInHorizon(today, horizonEnd, blockedByCar.get(car.id) ?? new Set()))
      .slice(0, 4);
  }

  return (
    <div className="bg-[#f7f9f6]">
      <HomePromoBanner />

      <section className="relative overflow-hidden bg-[#fbfcf9]">
        <div className="absolute inset-y-0 right-0 hidden w-[53%] lg:block">
          <Image
            src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1800&q=88"
            alt="Premium rental car on the road"
            fill
            priority
            className="object-cover"
            sizes="53vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#fbfcf9] via-[#fbfcf9]/35 to-transparent" />
        </div>

        <div className="page-shell relative grid min-h-[590px] items-center py-16 lg:grid-cols-2 lg:py-20">
          <div className="relative z-10 max-w-xl pb-32 lg:pb-20">
            <p className="eyebrow">Car rental, made personal</p>
            <h1 className="font-display mt-5 text-5xl leading-[1.04] tracking-[-0.035em] text-slate-900 sm:text-6xl lg:text-7xl">
              Your journey,<br /><span className="text-emerald-700">our cars.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-slate-600 sm:text-lg">
              Find and book reliable cars in Harare with transparent pricing, flexible dates, and a simple rental experience from start to finish.
            </p>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-600">
              {['Verified vehicles', 'Flexible dates', 'Local support'].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m5 12 4 4L19 6" /></svg>
                  </span>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="absolute bottom-10 left-4 right-4 z-20 sm:left-6 sm:right-6 lg:bottom-12 lg:left-8 lg:right-8">
            <div className="mx-auto max-w-5xl"><SearchForm cities={cities ?? undefined} /></div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-slate-200/70 bg-white py-8">
        <div className="page-shell grid gap-6 md:grid-cols-3">
          {[
            ['01', 'Choose your dates', 'Search the days you need and only see suitable vehicles.'],
            ['02', 'Select your car', 'Compare clear daily rates, photos, and vehicle details.'],
            ['03', 'Book with confidence', 'Request your trip and manage every detail from your account.'],
          ].map(([number, title, copy]) => (
            <div key={number} className="flex gap-4 border-slate-200 md:not-last:border-r md:not-last:pr-7">
              <span className="font-display text-3xl text-emerald-700/45">{number}</span>
              <div><h2 className="font-semibold text-slate-900">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{copy}</p></div>
            </div>
          ))}
        </div>
      </section>

      {featuredCars.length > 0 && (
        <section className="py-20">
          <div className="page-shell">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow">Available now</p>
                <h2 className="font-display mt-2 text-3xl tracking-tight text-slate-900 sm:text-4xl">Popular cars in Harare</h2>
                <p className="mt-2 text-slate-500">A curated selection ready for your next trip.</p>
              </div>
              <Link href="/listings" className="text-sm font-semibold text-emerald-700 hover:text-emerald-900">View all cars →</Link>
            </div>
            <div className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredCars.map((car) => <CarCard key={car.id} car={car} />)}
            </div>
          </div>
        </section>
      )}

      <section id="why-us" className="bg-white py-20">
        <div className="page-shell">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Why Rental Car Connect</p>
            <h2 className="font-display mt-3 text-3xl tracking-tight text-slate-900 sm:text-4xl">A calmer way to rent a car</h2>
            <p className="mt-3 text-slate-500">The essentials are clear before you book, and your rental stays easy to manage afterward.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              ['Flexible dates', 'Find vehicles around your actual travel dates and manage your booking from one place.', 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z'],
              ['Harare focused', 'A locally focused fleet with pickup details that are relevant to how you actually travel.', 'M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11Zm0-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'],
              ['Managed fleet', 'Vehicles are listed and managed centrally by our team for a more consistent rental experience.', 'm9 12 2 2 4-4m5.62-4.02A11.95 11.95 0 0 1 12 2.94a11.95 11.95 0 0 1-8.62 3.04A12 12 0 0 0 3 9c0 5.59 3.82 10.29 9 11.62 5.18-1.33 9-6.03 9-11.62 0-1.04-.13-2.05-.38-3.02Z'],
            ].map(([title, copy, path]) => (
              <div key={title} className="surface-card p-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d={path} /></svg></div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{copy}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 flex justify-center"><Link href="/listings" className="primary-button">Browse all cars <span className="ml-2">→</span></Link></div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-[#f7f9f6] py-8">
        <div className="page-shell flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold text-emerald-800">Rental Car Connect</p>
          <p>Simple, reliable car rental in Harare.</p>
        </div>
      </footer>
    </div>
  );
}
