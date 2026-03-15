import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id, start_date, end_date, status, total_amount_zwl, car_id,
      cars (id, make, model, year, image_urls, daily_rate_zwl, location_city, car_type)
    `)
    .eq('renter_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: myCars } = await supabase
    .from('cars')
    .select('id, make, model, year, car_type, location_city, daily_rate_zwl, image_urls, description, owner_id, is_active')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">My bookings</h2>
            <Link href="/dashboard/bookings" className="text-sm text-gray-600 hover:underline">
              View all
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {(bookings ?? []).length === 0 ? (
              <li className="text-gray-500">No bookings yet.</li>
            ) : (
              (bookings ?? []).map((b) => {
                const car = Array.isArray(b.cars) ? b.cars[0] : b.cars;
                const c = car as { make?: string; model?: string; year?: number } | null;
                return (
                <li key={b.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                  <div>
                    <p className="font-medium">
                      {c?.make} {c?.model}
                    </p>
                    <p className="text-sm text-gray-500">
                      {b.start_date} – {b.end_date} · {b.status}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/bookings/${b.id}`}
                    className="text-sm font-medium text-gray-900 hover:underline"
                  >
                    View
                  </Link>
                </li>
                );
              })
            )}
          </ul>
        </section>
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">My listings</h2>
            <Link
              href="/dashboard/listings/new"
              className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Add car
            </Link>
          </div>
          {(myCars ?? []).length === 0 ? (
            <p className="mt-4 text-gray-500">You haven’t listed any cars yet.</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {(myCars ?? []).map((car) => (
                <div key={car.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                  <div>
                    <p className="font-medium">{car.make} {car.model} ({car.year})</p>
                    <p className="text-sm text-gray-500">{car.location_city}</p>
                  </div>
                  <Link
                    href={`/dashboard/listings/${car.id}/edit`}
                    className="text-sm font-medium text-gray-900 hover:underline"
                  >
                    Edit
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <div className="mt-8">
        <Link href="/support" className="text-gray-600 hover:text-gray-900 underline">
          Support tickets
        </Link>
      </div>
    </div>
  );
}
