import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatDailyRateUsd } from '@/lib/money';
import { BookingRowActions } from '@/components/admin/BookingRowActions';

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const [carsRes, usersRes, ticketsRes, bookingsCountRes, activeCarsRes, bookingsRowsRes, recentBookingsRes] = await Promise.all([
    supabase.from('cars').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }).neq('status', 'resolved'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('cars').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('bookings').select('total_amount_usd, status, created_at'),
    supabase.from('bookings').select(`id, car_id, start_date, end_date, status, total_amount_usd, created_at, cars (make, model), profiles (display_name)`).order('created_at', { ascending: false }).limit(6),
  ]);

  const bookings = bookingsRowsRes.data ?? [];
  const sumFor = (statuses: string[]) => bookings.filter((b) => statuses.includes(b.status)).reduce((sum, b) => sum + Number(b.total_amount_usd ?? 0), 0);
  const completedRevenue = sumFor(['completed']);
  const pipeline = sumFor(['pending', 'confirmed']);
  const byStatus = ['pending', 'confirmed', 'completed', 'cancelled'].map((status) => ({ status, count: bookings.filter((b) => b.status === status).length }));
  const maxStatus = Math.max(1, ...byStatus.map((item) => item.count));

  const stats = [
    ['Total cars', String(carsRes.count ?? 0), `${activeCarsRes.count ?? 0} active`, '/admin/cars'],
    ['Active bookings', String(bookings.filter((b) => ['pending', 'confirmed'].includes(b.status)).length), `${bookingsCountRes.count ?? 0} total`, '/admin/bookings'],
    ['Completed revenue', formatDailyRateUsd(completedRevenue), `${formatDailyRateUsd(pipeline)} pipeline`, '/admin/bookings?status=completed'],
    ['Customers', String(usersRes.count ?? 0), `${ticketsRes.count ?? 0} open support`, '/admin/users'],
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="eyebrow">Operations</p><h1 className="font-display mt-2 text-4xl tracking-tight text-slate-900">Dashboard overview</h1><p className="mt-2 text-slate-500">A clear view of fleet activity, bookings, customers, and revenue.</p></div>
        <div className="flex flex-wrap gap-3"><Link href="/admin/bookings" className="secondary-button">View bookings</Link><Link href="/admin/cars/new" className="primary-button">+ Add new car</Link></div>
      </div>

      <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, hint, href]) => (
          <Link key={label} href={href} className="surface-card group p-5 transition hover:-translate-y-0.5 hover:border-emerald-200">
            <div className="flex items-start justify-between"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">{label}</p><span className="text-emerald-700 transition group-hover:translate-x-0.5">↗</span></div>
            <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">{value}</p><p className="mt-2 text-sm text-slate-500">{hint}</p>
          </Link>
        ))}
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <section className="surface-card p-6 sm:p-7">
          <div className="flex items-center justify-between"><div><p className="eyebrow">Booking mix</p><h2 className="mt-1 text-xl font-semibold text-slate-900">Booking status</h2></div><Link href="/admin/bookings" className="text-sm font-semibold text-emerald-700">View all →</Link></div>
          <div className="mt-7 space-y-5">
            {byStatus.map(({ status, count }) => (
              <Link key={status} href={`/admin/bookings?status=${status}`} className="block">
                <div className="mb-2 flex items-center justify-between text-sm"><span className="font-medium capitalize text-slate-700">{status}</span><span className="font-semibold text-slate-900">{count}</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-700" style={{ width: `${Math.max(count ? 12 : 0, (count / maxStatus) * 100)}%` }} /></div>
              </Link>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 border-t border-slate-100 pt-6">
            <div className="rounded-2xl bg-emerald-50/70 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Pipeline</p><p className="mt-2 text-lg font-semibold text-emerald-900">{formatDailyRateUsd(pipeline)}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Completed</p><p className="mt-2 text-lg font-semibold text-slate-900">{formatDailyRateUsd(completedRevenue)}</p></div>
          </div>
        </section>

        <section className="surface-card p-6 sm:p-7">
          <div className="flex items-center justify-between"><div><p className="eyebrow">Latest activity</p><h2 className="mt-1 text-xl font-semibold text-slate-900">Recent bookings</h2></div><Link href="/admin/bookings" className="text-sm font-semibold text-emerald-700">View all →</Link></div>
          <div className="mt-5 divide-y divide-slate-100">
            {(recentBookingsRes.data ?? []).length === 0 ? <p className="py-12 text-center text-sm text-slate-500">No bookings yet.</p> : (recentBookingsRes.data ?? []).map((row) => {
              const carRaw = row.cars as { make?: string; model?: string } | null;
              const renterRaw = row.profiles as { display_name?: string | null } | null;
              const car = Array.isArray(carRaw) ? carRaw[0] : carRaw;
              const renter = Array.isArray(renterRaw) ? renterRaw[0] : renterRaw;
              return (
                <div key={row.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0"><p className="font-semibold text-slate-900">{car?.make} {car?.model}</p><p className="mt-1 text-xs text-slate-500">{row.start_date} → {row.end_date}{renter?.display_name ? ` · ${renter.display_name}` : ''}</p><span className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold capitalize text-slate-600">{row.status}</span></div>
                  <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end"><span className="font-semibold text-emerald-800">{formatDailyRateUsd(Number(row.total_amount_usd))}</span><BookingRowActions bookingId={row.id} status={row.status} /></div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="mt-7 grid gap-4 md:grid-cols-3">
        <Link href="/admin/cars" className="surface-card p-5 transition hover:border-emerald-200"><p className="font-semibold text-slate-900">Manage fleet</p><p className="mt-1 text-sm text-slate-500">Edit listings, pricing, photos, and visibility.</p><p className="mt-4 text-sm font-semibold text-emerald-700">Open fleet →</p></Link>
        <Link href="/admin/users" className="surface-card p-5 transition hover:border-emerald-200"><p className="font-semibold text-slate-900">Customer management</p><p className="mt-1 text-sm text-slate-500">Review registered customer accounts.</p><p className="mt-4 text-sm font-semibold text-emerald-700">View customers →</p></Link>
        <Link href="/admin/support" className="surface-card p-5 transition hover:border-emerald-200"><p className="font-semibold text-slate-900">Support queue</p><p className="mt-1 text-sm text-slate-500">Resolve rental questions and support requests.</p><p className="mt-4 text-sm font-semibold text-emerald-700">Open support →</p></Link>
      </section>
    </div>
  );
}
