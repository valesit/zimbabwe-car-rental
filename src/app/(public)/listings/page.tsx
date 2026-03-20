import { createClient } from '@/lib/supabase/server';
import { CarCard } from '@/components/CarCard';
import { ListingsFilters } from '@/components/ListingsFilters';

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

  function renderError(message: string, detail?: string) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="font-brand text-2xl font-medium text-slate-800 sm:text-3xl">
          Browse <span className="text-emerald-600">cars</span> in Harare
        </h1>
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-800">{message}</p>
          {detail && <p className="mt-1 text-sm text-red-700">{detail}</p>}
          <p className="mt-3 text-sm text-red-600">
            Run all migrations in Supabase SQL Editor (001 through 008). If you see &quot;infinite recursion&quot;, run{" "}
            <code className="rounded bg-red-100 px-1 py-0.5">005_fix_rls_recursion.sql</code>.
          </p>
        </div>
      </div>
    );
  }

  try {
    const { data: cities } = await supabase.from('cities').select('name').order('name');

    let query = supabase
      .from('cars')
      .select('id, make, model, year, car_type, location_city, daily_rate_usd, image_urls, description, owner_id')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (city) query = query.eq('location_city', city);
    if (carType) query = query.eq('car_type', carType);

    const { data: cars, error } = await query;

    if (error) {
      return renderError('Failed to load listings.', error.message);
    }

    let carIds = (cars ?? []).map((c) => c.id);
    if (start && end && carIds.length > 0) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const days: string[] = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        days.push(d.toISOString().slice(0, 10));
      }
      // Opt-out calendar: cars are available unless a row exists with is_available = false
      const { data: blockedRows } = await supabase
        .from('car_availability')
        .select('car_id')
        .in('car_id', carIds)
        .in('available_date', days)
        .eq('is_available', false);
      const blockedCarIds = new Set((blockedRows ?? []).map((r) => r.car_id));
      carIds = carIds.filter((id) => !blockedCarIds.has(id));
    }

    const filteredCars = (cars ?? []).filter((c) => carIds.includes(c.id));

    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="font-brand text-2xl font-medium text-slate-800 sm:text-3xl">
          Browse <span className="text-emerald-600">cars</span> in Harare
        </h1>
        <ListingsFilters
          start={start}
          end={end}
          city={city}
          type={carType}
          cities={cities ?? undefined}
        />
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCars.length === 0 ? (
            <p className="col-span-full text-gray-500">No cars match your filters.</p>
          ) : (
            filteredCars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))
          )}
        </div>
      </div>
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return renderError('Something went wrong.', message);
  }
}
