import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatDailyRateUsd } from '@/lib/money';
import { BookingRowActions } from '@/components/admin/BookingRowActions';

export const revalidate = 30;

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const filter = params?.status ?? 'all';

  const supabase = await createClient();

  let query = supabase
    .from('bookings')
    .select(
      `
      id,
      car_id,
      start_date,
      end_date,
      status,
      total_amount_usd,
      created_at,
      cars (make, model),
      profiles (display_name)
    `,
    )
    .order('created_at', { ascending: false });

  if (filter === 'pipeline') {
    query = query.in('status', ['pending', 'confirmed']);
  } else if (filter === 'completed' || filter === 'pending' || filter === 'confirmed' || filter === 'cancelled') {
    query = query.eq('status', filter);
  }

  const { data: rows, error } = await query;

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
        Failed to load bookings: {error.message}
      </div>
    );
  }

  const filterLinks: { label: string; value: string }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Pipeline', value: 'pipeline' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-brand text-3xl font-semibold tracking-tight text-slate-900">Bookings</h1>
          <p className="mt-1 text-slate-700">Review requests, approve to confirm, or decline to release dates.</p>
        </div>
        <Link
          href="/admin"
          className="text-sm font-medium text-emerald-700 hover:text-emerald-900 hover:underline"
        >
          ← Overview
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {filterLinks.map(({ label, value }) => {
          const href = value === 'all' ? '/admin/bookings' : `/admin/bookings?status=${value}`;
          const isActive = value === 'all' ? filter === 'all' : filter === value;
          return (
            <Link
              key={value}
              href={href}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-700">
            <tr>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Renter</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(rows ?? []).length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-600">
                  No bookings for this filter.
                </td>
              </tr>
            ) : (
              (rows ?? []).map((row) => {
                const car = row.cars as { make?: string; model?: string } | null;
                const renter = row.profiles as { display_name?: string | null } | null;
                const c = Array.isArray(car) ? car[0] : car;
                const r = Array.isArray(renter) ? renter[0] : renter;
                return (
                  <tr key={row.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {c?.make} {c?.model}
                    </td>
                    <td className="px-4 py-3 text-slate-800">
                      {row.start_date} → {row.end_date}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-800">
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-800">{r?.display_name ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-800">
                      {formatDailyRateUsd(Number(row.total_amount_usd))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <BookingRowActions bookingId={row.id} status={row.status} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
