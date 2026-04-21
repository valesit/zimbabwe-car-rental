import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatDailyRateUsd } from '@/lib/money';

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-900 ring-amber-200',
    confirmed: 'bg-sky-100 text-sky-900 ring-sky-200',
    completed: 'bg-emerald-100 text-emerald-900 ring-emerald-200',
    cancelled: 'bg-slate-100 text-slate-700 ring-slate-200',
  };
  return map[status] ?? 'bg-slate-100 text-slate-800 ring-slate-200';
}

export default async function BookingsPage() {
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
      cars (id, make, model, year, image_urls, location_city)
    `,
    )
    .eq('renter_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/dashboard" className="text-sm font-medium text-emerald-700 hover:underline">
        ← Overview
      </Link>
      <h1 className="mt-4 font-brand text-3xl font-semibold tracking-tight text-slate-900">My bookings</h1>
      <p className="mt-1 text-slate-700">Trips you’ve requested. Open a booking for full details.</p>

      <ul className="mt-8 space-y-4">
        {(bookings ?? []).length === 0 ? (
          <li className="rounded-2xl border border-dashed border-slate-200 bg-white py-14 text-center text-slate-600">
            No bookings yet.{' '}
            <Link href="/listings" className="font-semibold text-emerald-700 hover:underline">
              Browse cars
            </Link>
          </li>
        ) : (
          (bookings ?? []).map((b) => {
            const car = Array.isArray(b.cars) ? b.cars[0] : b.cars;
            const c = car as { make?: string; model?: string; year?: number } | null;
            return (
              <li
                key={b.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {c?.make} {c?.model}{' '}
                    <span className="font-medium text-slate-600">({c?.year})</span>
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {b.start_date} – {b.end_date}
                  </p>
                  <span
                    className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${statusBadge(b.status)}`}
                  >
                    {b.status}
                  </span>
                  <p className="mt-2 text-sm font-semibold text-emerald-800">
                    {formatDailyRateUsd(Number(b.total_amount_usd))}
                  </p>
                </div>
                <Link
                  href={`/dashboard/bookings/${b.id}`}
                  className="inline-flex shrink-0 justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  View details
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
