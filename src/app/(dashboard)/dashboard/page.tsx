import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatDailyRateUsd } from '@/lib/money';
import { BookingRowActions } from '@/components/admin/BookingRowActions';

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-900 ring-amber-200',
    confirmed: 'bg-sky-100 text-sky-900 ring-sky-200',
    completed: 'bg-emerald-100 text-emerald-900 ring-emerald-200',
    cancelled: 'bg-slate-100 text-slate-700 ring-slate-200',
  };
  return map[status] ?? 'bg-slate-100 text-slate-800 ring-slate-200';
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { count: renterBookingCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('renter_id', user.id);

  const { data: bookings } = await supabase
    .from('bookings')
    .select(
      `
      id, start_date, end_date, status, total_amount_usd, car_id,
      cars (id, make, model, year, image_urls, daily_rate_usd, location_city, car_type)
    `,
    )
    .eq('renter_id', user.id)
    .order('created_at', { ascending: false })
    .limit(6);

  const { data: ownedCars } = await supabase.from('cars').select('id').eq('owner_id', user.id);
  const ownedCarIds = (ownedCars ?? []).map((c) => c.id);

  const { data: ownerRequests } =
    ownedCarIds.length > 0
      ? await supabase
          .from('bookings')
          .select(
            `
      id,
      start_date,
      end_date,
      status,
      total_amount_usd,
      car_id,
      cars ( id, make, model ),
      profiles ( display_name )
    `,
          )
          .in('car_id', ownedCarIds)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(8)
      : { data: [] };

  const { count: carCount } = await supabase
    .from('cars')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', user.id);

  return (
    <div className="mx-auto max-w-6xl">
      <div>
        <h1 className="font-brand text-3xl font-semibold tracking-tight text-slate-900">Overview</h1>
        <p className="mt-1 text-slate-700">
          Trips you’ve booked and cars you host — same place, clear next steps.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">As a renter</p>
          <p className="mt-2 font-brand text-2xl font-semibold text-slate-900">{renterBookingCount ?? 0}</p>
          <p className="mt-1 text-sm font-medium text-slate-700">Total trips you’ve requested</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">As a host</p>
          <p className="mt-2 font-brand text-2xl font-semibold text-slate-900">{carCount ?? 0}</p>
          <p className="mt-1 text-sm font-medium text-slate-700">Cars you list</p>
          <Link href="/dashboard/listings" className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:underline">
            Manage cars →
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Needs action</p>
          <p className="mt-2 font-brand text-2xl font-semibold text-amber-800">
            {(ownerRequests ?? []).length}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-700">Pending requests for your cars</p>
        </div>
      </div>

      {(ownerRequests ?? []).length > 0 && (
        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Requests for your cars</h2>
              <p className="mt-0.5 text-sm text-slate-700">Approve to confirm the trip, or decline to release those dates.</p>
            </div>
          </div>
          <ul className="mt-4 space-y-3">
            {(ownerRequests ?? []).map((row) => {
              const carRaw = row.cars;
              const car = (Array.isArray(carRaw) ? carRaw[0] : carRaw) as {
                make?: string;
                model?: string;
              } | null;
              const renterRaw = row.profiles;
              const renter = (Array.isArray(renterRaw) ? renterRaw[0] : renterRaw) as {
                display_name?: string | null;
              } | null;
              return (
                <li
                  key={row.id}
                  className="flex flex-col gap-3 rounded-2xl border border-amber-100 bg-amber-50/40 p-4 shadow-sm ring-1 ring-amber-100/80 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {car?.make} {car?.model}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-700">
                      {row.start_date} → {row.end_date}
                      {renter?.display_name ? ` · ${renter.display_name}` : ''}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-emerald-800">
                      {formatDailyRateUsd(Number(row.total_amount_usd))}
                    </p>
                  </div>
                  <BookingRowActions bookingId={row.id} status={row.status} />
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">My bookings</h2>
            <Link href="/dashboard/bookings" className="text-sm font-semibold text-emerald-700 hover:underline">
              View all
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {(bookings ?? []).length === 0 ? (
              <li className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-600">
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
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {c?.make} {c?.model}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-700">
                        {b.start_date} – {b.end_date}
                      </p>
                      <span
                        className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${statusBadge(b.status)}`}
                      >
                        {b.status}
                      </span>
                    </div>
                    <Link
                      href={`/dashboard/bookings/${b.id}`}
                      className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50"
                    >
                      View
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">My cars</h2>
            <Link
              href="/dashboard/listings/new"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Add car
            </Link>
          </div>
          <div className="mt-4">
            <Link
              href="/dashboard/listings"
              className="text-sm font-semibold text-emerald-700 hover:underline"
            >
              Manage all listings →
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-600">
            Set availability, photos, and pricing from the editor. Pending booking requests appear above.
          </p>
        </section>
      </div>

      <div className="mt-8">
        <Link href="/support" className="text-sm font-semibold text-slate-700 underline decoration-slate-300 hover:text-emerald-800">
          Support tickets
        </Link>
      </div>
    </div>
  );
}
