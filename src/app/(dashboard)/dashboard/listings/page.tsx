import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ListingPublishToggle } from '@/components/ListingPublishToggle';

export default async function DashboardListingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: myCars } = await supabase
    .from('cars')
    .select('id, make, model, year, car_type, location_city, daily_rate_usd, is_active')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-brand text-3xl font-semibold tracking-tight text-slate-900">My cars</h1>
          <p className="mt-1 text-slate-700">
            Publish to show on the site, or unpublish anytime. Dates stay open unless you block them or a booking uses them.
          </p>
        </div>
        <Link
          href="/dashboard/listings/new"
          className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700"
        >
          Add car
        </Link>
      </div>

      {(myCars ?? []).length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-700">You haven’t listed any cars yet.</p>
          <Link
            href="/dashboard/listings/new"
            className="mt-4 inline-flex rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            List your first car
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {(myCars ?? []).map((car) => (
            <div
              key={car.id}
              className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:flex-row sm:items-center"
            >
              <div>
                <p className="font-semibold text-slate-900">
                  {car.make} {car.model}{' '}
                  <span className="font-medium text-slate-600">({car.year})</span>
                </p>
                <p className="mt-1 text-sm text-slate-700">{car.location_city}</p>
                <p className="mt-1 text-xs font-medium">
                  {car.is_active ? (
                    <span className="text-emerald-700">Published</span>
                  ) : (
                    <span className="text-slate-600">Unpublished — not visible on listings</span>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                <ListingPublishToggle carId={car.id} isPublished={car.is_active} />
                <Link
                  href={`/dashboard/listings/${car.id}/edit`}
                  className="inline-flex rounded-lg border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
                >
                  Edit &amp; block dates
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
