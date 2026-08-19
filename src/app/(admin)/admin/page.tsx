import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatDailyRateUsd } from '@/lib/money';
import { BookingRowActions } from '@/components/admin/BookingRowActions';

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-800 ring-amber-200',
    confirmed: 'bg-sky-50 text-sky-800 ring-sky-200',
    completed: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    cancelled: 'bg-slate-100 text-slate-600 ring-slate-200',
  };
  return map[status] ?? 'bg-slate-100 text-slate-700 ring-slate-200';
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    carsRes,
    usersRes,
    ticketsRes,
    activeCarsRes,
    bookingsRowsRes,
    recentBookingsRes,
  ] = await Promise.all([
    supabase.from('cars').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user'),
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }).neq('status', 'resolved'),
    supabase.from('cars').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('bookings').select('total_amount_usd, status, created_at'),
    supabase
      .from('bookings')
      .select(`
        id, car_id, start_date, end_date, status, total_amount_usd, created_at,
        cars (make, model),
        profiles (display_name)
      `)
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  const bookings = bookingsRowsRes.data ?? [];
  const sumFor = (statuses: string[]) =>
    bookings
      .filter((booking) => statuses.includes(booking.status))
      .reduce((sum, booking) => sum + Number(booking.total_amount_usd ?? 0), 0);

  const revenueCompleted = sumFor(['completed']);
  const pipeline = sumFor(['pending', 'confirmed']);
  const activeBookings = bookings.filter((booking) => ['pending', 'confirmed'].includes(booking.status)).length;
  const pendingCount = bookings.filter((booking) => booking.status === 'pending').length;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const bookingsThisMonth = bookings.filter((booking) => (booking.created_at ?? '').slice(0, 10) >= monthStart).length;

  const statusSummary = ['pending', 'confirmed', 'completed', 'cancelled'].map((status) => ({
    status,
    count: bookings.filter((booking) => booking.status === status).length,
  }));
  const maxStatusCount = Math.max(1, ...statusSummary.map((item) => item.count));

  return (
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Operations</p>
          <h1 className="font-display mt-2 text-4xl font-medium tracking-[-0.035em] text-slate-950 sm:text-5xl">Dashboard overview</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Monitor fleet availability, booking activity, customer demand and support from one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/bookings?status=pending"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:text-emerald-900"
          >
            Review requests
          </Link>
          <Link
            href="/admin/cars/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-950"
          >
            + Add new car
          </Link>
        </div>
      </header>

      <section className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Fleet"
          value={String(carsRes.count ?? 0)}
          detail={`${activeCarsRes.count ?? 0} active vehicles`}
          href="/admin/cars"
        />
        <MetricCard
          label="Active bookings"
          value={String(activeBookings)}
          detail={`${pendingCount} awaiting action`}
          href="/admin/bookings?status=pipeline"
        />
        <MetricCard
          label="Completed revenue"
          value={formatDailyRateUsd(revenueCompleted)}
          detail={`${bookingsThisMonth} bookings this month`}
          href="/admin/bookings?status=completed"
        />
        <MetricCard
          label="Customers"
          value={String(usersRes.count ?? 0)}
          detail={`${ticketsRes.count ?? 0} open support requests`}
          href="/admin/users"
        />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[0.78fr_1.4fr_0.72fr]">
        <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.5)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">Booking mix</p>
              <h2 className="font-display mt-2 text-2xl font-medium text-slate-950">Status overview</h2>
            </div>
            <Link href="/admin/bookings" className="text-xs font-semibold text-emerald-800 hover:text-emerald-950">View all</Link>
          </div>
          <div className="mt-6 space-y-5">
            {statusSummary.map(({ status, count }) => (
              <div key={status}>
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize font-medium text-slate-700">{status}</span>
                  <span className="font-semibold text-slate-950">{count}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-800" style={{ width: `${Math.max(5, (count / maxStatusCount) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-7 rounded-2xl bg-emerald-950 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.13em] text-emerald-200">Booking pipeline</p>
            <p className="font-display mt-2 text-3xl font-medium">{formatDailyRateUsd(pipeline)}</p>
            <p className="mt-1 text-xs leading-5 text-emerald-50/65">Value currently sitting in pending or confirmed bookings.</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_20px_50px_-40px_rgba(15,23,42,0.5)]">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:px-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">Latest activity</p>
              <h2 className="font-display mt-2 text-2xl font-medium text-slate-950">Recent bookings</h2>
            </div>
            <Link href="/admin/bookings" className="text-sm font-semibold text-emerald-800 hover:text-emerald-950">View all →</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {(recentBookingsRes.data ?? []).length === 0 ? (
              <div className="px-6 py-14 text-center text-sm text-slate-500">No bookings yet.</div>
            ) : (
              (recentBookingsRes.data ?? []).map((row) => {
                const carRaw = row.cars;
                const renterRaw = row.profiles;
                const car = (Array.isArray(carRaw) ? carRaw[0] : carRaw) as { make?: string; model?: string } | null;
                const renter = (Array.isArray(renterRaw) ? renterRaw[0] : renterRaw) as { display_name?: string | null } | null;
                return (
                  <div key={row.id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-950">{car?.make} {car?.model}</p>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ${statusBadge(row.status)}`}>
                          {row.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {renter?.display_name || 'Customer'} · {formatDate(row.start_date)} → {formatDate(row.end_date)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
                      <span className="font-semibold text-emerald-900">{formatDailyRateUsd(Number(row.total_amount_usd))}</span>
                      <BookingRowActions bookingId={row.id} status={row.status} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.5)]">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">Quick actions</p>
            <div className="mt-4 space-y-2">
              <QuickLink href="/admin/cars/new" label="Add a vehicle" />
              <QuickLink href="/admin/bookings?status=pending" label="Review pending bookings" />
              <QuickLink href="/admin/support" label="Open support queue" />
              <QuickLink href="/admin/promo" label="Update site banner" />
            </div>
          </div>
          <div className="rounded-3xl bg-[#eadfcf] p-6 text-slate-950">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-600">Operational focus</p>
            <h3 className="font-display mt-2 text-2xl font-medium">Keep the fleet ready.</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Review active listings, pricing and availability before high-demand periods.</p>
            <Link href="/admin/cars" className="mt-5 inline-flex text-sm font-semibold text-slate-900 hover:underline">Manage fleet →</Link>
          </div>
        </aside>
      </section>
    </div>
  );
}

function MetricCard({ label, value, detail, href }: { label: string; value: string; detail: string; href: string }) {
  return (
    <Link href={href} className="group rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_16px_40px_-36px_rgba(15,23,42,0.5)] transition hover:-translate-y-0.5 hover:border-emerald-200">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="font-display mt-2 text-3xl font-medium tracking-[-0.03em] text-slate-950">{value}</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">{detail}</p>
        <span className="text-emerald-800 opacity-0 transition group-hover:opacity-100" aria-hidden>→</span>
      </div>
    </Link>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-950">
      {label}<span className="text-emerald-700" aria-hidden>→</span>
    </Link>
  );
}

function formatDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
