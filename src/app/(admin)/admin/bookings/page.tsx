import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getRenterAuthEmails } from '@/lib/admin/renter-emails';
import { formatDailyRateUsd } from '@/lib/money';
import { BookingRowActions } from '@/components/admin/BookingRowActions';

export const revalidate = 30;

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-800 ring-amber-200',
    confirmed: 'bg-sky-50 text-sky-800 ring-sky-200',
    completed: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    cancelled: 'bg-slate-100 text-slate-600 ring-slate-200',
  };
  return map[status] ?? 'bg-slate-100 text-slate-700 ring-slate-200';
}

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
      id, car_id, renter_id, start_date, end_date, status, total_amount_usd, created_at,
      cars (make, model),
      renter:profiles!bookings_renter_id_fkey (display_name, phone)
    `,
    )
    .order('created_at', { ascending: false });

  if (filter === 'pipeline') {
    query = query.in('status', ['pending', 'confirmed']);
  } else if (['completed', 'pending', 'confirmed', 'cancelled'].includes(filter)) {
    query = query.eq('status', filter);
  }

  const { data: rows, error } = await query;
  if (error) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">Failed to load bookings: {error.message}</div>;
  }

  const list = rows ?? [];
  const distinctRenterIds = Array.from(new Set(list.map((booking) => booking.renter_id).filter(Boolean))) as string[];
  const emailByRenter = await getRenterAuthEmails(distinctRenterIds);
  const displayedValue = list.reduce((sum, booking) => sum + Number(booking.total_amount_usd ?? 0), 0);
  const pendingInView = list.filter((booking) => booking.status === 'pending').length;

  const filterLinks = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Pipeline', value: 'pipeline' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Operations</p>
          <h1 className="font-display mt-2 text-4xl font-medium tracking-[-0.035em] text-slate-950 sm:text-5xl">Booking management</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">Review customer bookings, confirm requests and keep upcoming rentals moving smoothly.</p>
        </div>
        <Link href="/admin" className="text-sm font-semibold text-emerald-800 hover:text-emerald-950">← Dashboard</Link>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Bookings shown" value={String(list.length)} detail={`Filter: ${filter === 'all' ? 'all bookings' : filter}`} />
        <Stat label="Value shown" value={formatDailyRateUsd(displayedValue)} detail="Total booking value in this view" />
        <Stat label="Needs review" value={String(pendingInView)} detail="Pending requests in this view" />
      </section>

      <nav className="mt-7 flex flex-wrap gap-2" aria-label="Booking status filters">
        {filterLinks.map(({ label, value }) => {
          const href = value === 'all' ? '/admin/bookings' : `/admin/bookings?status=${value}`;
          const active = filter === value;
          return (
            <Link
              key={value}
              href={href}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                active
                  ? 'bg-emerald-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:text-emerald-900'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_20px_50px_-40px_rgba(15,23,42,0.5)]">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80">
              <tr>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Reference</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Customer</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Vehicle</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Rental dates</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Contact</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Status</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Total</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <p className="font-display text-2xl font-medium text-slate-950">No bookings in this view.</p>
                    <p className="mt-2 text-sm text-slate-500">Try another filter to see more booking activity.</p>
                  </td>
                </tr>
              ) : (
                list.map((row) => {
                  const carRaw = row.cars;
                  const renterRaw = row.renter;
                  const car = (Array.isArray(carRaw) ? carRaw[0] : carRaw) as { make?: string; model?: string } | null;
                  const renter = (Array.isArray(renterRaw) ? renterRaw[0] : renterRaw) as { display_name?: string | null; phone?: string | null } | null;
                  const refId = String(row.id);
                  const email = row.renter_id ? emailByRenter[row.renter_id] ?? null : null;

                  return (
                    <tr key={row.id} className="align-top transition hover:bg-emerald-50/25">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-semibold text-slate-500" title={refId}>#{refId.slice(0, 8).toUpperCase()}</span>
                        <p className="mt-1 text-[11px] text-slate-400">{new Date(row.created_at).toLocaleDateString()}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-950">{renter?.display_name?.trim() || 'Customer'}</p>
                      </td>
                      <td className="px-4 py-4 font-medium text-slate-800">{car?.make} {car?.model}</td>
                      <td className="px-4 py-4 text-slate-600">
                        <p>{formatDate(row.start_date)}</p>
                        <p className="mt-1 text-xs text-slate-400">to {formatDate(row.end_date)}</p>
                      </td>
                      <td className="px-4 py-4 text-xs leading-5 text-slate-500">
                        <p className="max-w-[190px] break-all">{email?.trim() || '—'}</p>
                        <p>{renter?.phone?.trim() || '—'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ${statusBadge(row.status)}`}>{row.status}</span>
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-emerald-900">{formatDailyRateUsd(Number(row.total_amount_usd))}</td>
                      <td className="px-6 py-4 text-right"><BookingRowActions bookingId={row.id} status={row.status} /></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_16px_40px_-36px_rgba(15,23,42,0.5)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="font-display mt-2 text-3xl font-medium text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function formatDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
