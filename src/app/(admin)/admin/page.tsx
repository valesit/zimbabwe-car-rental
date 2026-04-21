import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatDailyRateUsd } from '@/lib/money';
import { BookingRowActions } from '@/components/admin/BookingRowActions';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    carsRes,
    usersRes,
    ticketsRes,
    bookingsCountRes,
    activeCarsRes,
    bookingsRowsRes,
    recentBookingsRes,
  ] = await Promise.all([
    supabase.from('cars').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }).neq('status', 'resolved'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('cars').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('bookings').select('total_amount_usd, status, created_at'),
    supabase
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
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  const bookings = bookingsRowsRes.data ?? [];
  const sumFor = (statuses: string[]) =>
    bookings
      .filter((b) => statuses.includes(b.status))
      .reduce((s, b) => s + Number(b.total_amount_usd ?? 0), 0);

  const revenueCompleted = sumFor(['completed']);
  const pipeline = sumFor(['pending', 'confirmed']);
  const totalBookingsValue = bookings.reduce((s, b) => s + Number(b.total_amount_usd ?? 0), 0);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const bookingsThisMonth = bookings.filter((b) => (b.created_at ?? '').slice(0, 10) >= monthStart).length;

  const byStatus = ['pending', 'confirmed', 'completed', 'cancelled'].map((status) => ({
    status,
    count: bookings.filter((b) => b.status === status).length,
  }));

  const statCards = [
    {
      label: 'Total bookings',
      value: String(bookingsCountRes.count ?? 0),
      hint: `${bookingsThisMonth} this month`,
      href: '/admin/bookings',
      accent: 'from-violet-500 to-purple-600',
    },
    {
      label: 'Revenue (completed)',
      value: formatDailyRateUsd(revenueCompleted),
      hint: 'From completed trips',
      href: '/admin/bookings?status=completed',
      accent: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'Pipeline (pending + confirmed)',
      value: formatDailyRateUsd(pipeline),
      hint: 'Not yet completed',
      href: '/admin/bookings?status=pipeline',
      accent: 'from-amber-500 to-orange-600',
    },
    {
      label: 'Booking value (all statuses)',
      value: formatDailyRateUsd(totalBookingsValue),
      hint: 'Includes cancelled rows',
      href: '/admin/bookings',
      accent: 'from-sky-500 to-blue-600',
    },
    {
      label: 'Active listings',
      value: String(activeCarsRes.count ?? 0),
      hint: `${carsRes.count ?? 0} total cars`,
      href: '/admin/cars',
      accent: 'from-teal-500 to-cyan-600',
    },
    {
      label: 'Users',
      value: String(usersRes.count ?? 0),
      hint: 'Registered profiles',
      href: '/admin/users',
      accent: 'from-indigo-500 to-blue-700',
    },
    {
      label: 'Open support',
      value: String(ticketsRes.count ?? 0),
      hint: 'Needs attention',
      href: '/admin/support',
      accent: 'from-rose-500 to-pink-600',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-brand text-3xl font-semibold tracking-tight text-slate-900">Overview</h1>
          <p className="mt-1 text-slate-700">Fleet health, bookings, and revenue at a glance.</p>
        </div>
        <Link
          href="/admin/promo"
          className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700"
        >
          Edit promo banner
        </Link>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/80 ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
          >
            <div
              className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${card.accent} opacity-20 blur-2xl transition group-hover:opacity-30`}
            />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">{card.label}</p>
            <p className="mt-2 font-brand text-2xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-1 text-sm font-medium text-slate-700">{card.hint}</p>
            <p className="mt-3 text-xs font-medium text-emerald-700 opacity-0 transition group-hover:opacity-100">
              Open details →
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">Bookings by status</h2>
          <ul className="mt-4 space-y-3">
            {byStatus.map(({ status, count }) => (
              <li key={status}>
                <Link
                  href={
                    status === 'pending'
                      ? '/admin/bookings?status=pending'
                      : `/admin/bookings?status=${status}`
                  }
                  className="flex items-center justify-between rounded-lg px-2 py-2 text-sm transition hover:bg-slate-50"
                >
                  <span className="capitalize text-slate-800">{status}</span>
                  <span className="font-semibold text-slate-900">{count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Recent bookings</h2>
            <Link href="/admin/bookings" className="text-sm font-medium text-emerald-700 hover:underline">
              View all →
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-slate-100">
            {(recentBookingsRes.data ?? []).length === 0 ? (
              <li className="py-6 text-center text-sm text-slate-600">No bookings yet.</li>
            ) : (
              (recentBookingsRes.data ?? []).map((row) => {
                const car = row.cars as { make?: string; model?: string } | null;
                const renter = row.profiles as { display_name?: string | null } | null;
                const c = Array.isArray(car) ? car[0] : car;
                const r = Array.isArray(renter) ? renter[0] : renter;
                return (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-start justify-between gap-3 py-4 text-sm first:pt-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900">
                        {c?.make} {c?.model}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-700">
                        {row.start_date} → {row.end_date} ·{' '}
                        <span className="capitalize font-medium">{row.status}</span>
                        {r?.display_name ? ` · ${r.display_name}` : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className="font-semibold text-emerald-800">
                        {formatDailyRateUsd(Number(row.total_amount_usd))}
                      </span>
                      <BookingRowActions bookingId={row.id} status={row.status} />
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
