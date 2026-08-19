import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { CarCard } from '@/components/CarCard';
import { ListingsFilters } from '@/components/ListingsFilters';
import { hasOpenDayInHorizon, horizonEndIso } from '@/lib/availability';

export const revalidate = 60;

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string; city?: string; type?: string }>;
}) {
  const supabase = await createClient();
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const start = params?.start;
  const end = params?.end;
  const city = params?.city;
  const carType = params?.type;

  function renderError() {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#f8faf8]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Our fleet</p>
          <h1 className="font-display mt-3 text-4xl font-medium tracking-[-0.03em] text-slate-950 sm:text-5xl">We could not load the fleet right now.</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">Please try again shortly or contact support if you need help finding a car.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/listings" className="rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-950">Try again</Link>
            <Link href="/support" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-emerald-200 hover:text-emerald-900">Contact support</Link>
          </div>
        </div>
      </div>
    );
  }

  try {
    const { data: cities } = await supabase.from('cities').select('name').order('name');

    let query = supabase
      .from('cars')
      .select('id, make, model, year, car_type, location_city, daily_rate_usd, image_urls, description')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (city) query = query.eq('location_city', city);
    if (carType) query = query.eq('car_type', carType);

    const { data: cars, error } = await query;
    if (error) return renderError();

    const today = new Date().toISOString().slice(0, 10);
    const horizonEnd = horizonEndIso(today);

    let carIds = (cars ?? []).map((car) => car.id);
    if (start && end && carIds.length > 0) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const days: string[] = [];
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        days.push(date.toISOString().slice(0, 10));
      }
      const { data: blockedRows } = await supabase
        .from('car_availability')
        .select('car_id')
        .in('car_id', carIds)
        .in('available_date', days)
        .eq('is_available', false);
      const blockedCarIds = new Set((blockedRows ?? []).map((row) => row.car_id));
      carIds = carIds.filter((id) => !blockedCarIds.has(id));
    } else if (carIds.length > 0) {
      const { data: horizonBlocked } = await supabase
        .from('car_availability')
        .select('car_id, available_date')
        .in('car_id', carIds)
        .gte('available_date', today)
        .lte('available_date', horizonEnd)
        .eq('is_available', false);

      const blockedByCar = new Map<string, Set<string>>();
      for (const row of horizonBlocked ?? []) {
        if (!blockedByCar.has(row.car_id)) blockedByCar.set(row.car_id, new Set());
        blockedByCar.get(row.car_id)!.add(row.available_date);
      }

      carIds = carIds.filter((id) =>
        hasOpenDayInHorizon(today, horizonEnd, blockedByCar.get(id) ?? new Set()),
      );
    }

    const filteredCars = (cars ?? []).filter((car) => carIds.includes(car.id));
    const resultLabel = `${filteredCars.length} ${filteredCars.length === 1 ? 'vehicle' : 'vehicles'}`;

    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#f8faf8]">
        <section className="border-b border-slate-200/70 bg-gradient-to-b from-emerald-50/55 to-[#f8faf8]">
          <div className="mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 sm:pb-10 sm:pt-14 lg:px-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Our fleet</p>
                <h1 className="font-display mt-3 text-4xl font-medium tracking-[-0.035em] text-slate-950 sm:text-5xl lg:text-[3.5rem]">Find a car that fits your journey.</h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">Choose your dates, compare available vehicles and book with confidence. Every car is managed through Rental Car Connect.</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-500 lg:w-[360px]">
                <TrustPill title="Managed" detail="Fleet" />
                <TrustPill title="Clear" detail="Pricing" />
                <TrustPill title="Local" detail="Support" />
              </div>
            </div>
            <div className="mt-8">
              <ListingsFilters start={start} end={end} city={city} type={carType} cities={cities ?? undefined} />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-800">{resultLabel} available</p>
              <h2 className="font-display mt-1 text-2xl font-medium tracking-[-0.025em] text-slate-950 sm:text-3xl">Available cars</h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <svg className="h-4 w-4 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2m5-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Availability updates as your dates change
            </div>
          </div>

          {filteredCars.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-[0_18px_45px_-36px_rgba(15,23,42,0.4)] sm:px-10">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 13l2-5h14l2 5M5 13h14v5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H8v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-5Zm3-5 1-3h6l1 3" />
                </svg>
              </div>
              <h3 className="font-display mt-5 text-2xl font-medium text-slate-950">No cars match those filters.</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Try adjusting your travel dates or vehicle type to see more of the fleet.</p>
              <Link href="/listings" className="mt-6 inline-flex items-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-emerald-200 hover:text-emerald-800">View all cars</Link>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCars.map((car) => <CarCard key={car.id} car={car} />)}
            </div>
          )}

          <div className="mt-12 flex flex-col gap-4 rounded-3xl border border-emerald-100 bg-emerald-50/60 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div>
              <p className="font-display text-xl font-medium text-slate-950">Not sure which car to choose?</p>
              <p className="mt-1 text-sm text-slate-600">Our support team can help you find the right fit for your trip.</p>
            </div>
            <Link href="/support" className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-emerald-900 shadow-sm ring-1 ring-emerald-100 transition hover:bg-emerald-900 hover:text-white">Get help choosing</Link>
          </div>
        </section>
      </div>
    );
  } catch {
    return renderError();
  }
}

function TrustPill({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white/80 px-3 py-3 shadow-sm">
      <p className="font-semibold text-emerald-950">{title}</p>
      <p className="mt-0.5 text-[11px] text-slate-400">{detail}</p>
    </div>
  );
}
