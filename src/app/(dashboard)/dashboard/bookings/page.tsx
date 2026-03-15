import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function BookingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id, start_date, end_date, status, total_amount_zwl, car_id,
      cars (id, make, model, year, image_urls, location_city)
    `)
    .eq('renter_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
        &larr; Dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">My bookings</h1>
      <ul className="mt-6 space-y-4">
        {(bookings ?? []).length === 0 ? (
          <li className="text-gray-500">No bookings yet.</li>
        ) : (
          (bookings ?? []).map((b) => {
            const car = Array.isArray(b.cars) ? b.cars[0] : b.cars;
            const c = car as { make?: string; model?: string; year?: number } | null;
            return (
            <li key={b.id} className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {c?.make} {c?.model} ({c?.year})
                  </p>
                  <p className="text-sm text-gray-500">
                    {b.start_date} – {b.end_date} · {b.status}
                  </p>
                  <p className="text-sm text-gray-600">
                    ZWL {Number(b.total_amount_zwl).toLocaleString()}
                  </p>
                </div>
                <Link
                  href={`/dashboard/bookings/${b.id}`}
                  className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  View
                </Link>
              </div>
            </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
