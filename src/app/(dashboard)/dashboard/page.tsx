import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { formatDailyRateUsd } from '@/lib/money';
import { CarCard } from '@/components/CarCard';
import { carListingImageUrl } from '@/lib/carImages';

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-800 ring-amber-200',
    confirmed: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    completed: 'bg-slate-100 text-slate-700 ring-slate-200',
    cancelled: 'bg-rose-50 text-rose-700 ring-rose-200',
  };
  return map[status] ?? 'bg-slate-100 text-slate-700 ring-slate-200';
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`id, start_date, end_date, status, total_amount_usd, car_id, cars (id, make, model, year, image_urls, daily_rate_usd, location_city, car_type)`)
    .eq('renter_id', user.id)
    .order('created_at', { ascending: false });

  const { data: recommendedCars } = await supabase
    .from('cars')
    .select('id, make, model, year, car_type, location_city, daily_rate_usd, image_urls, description')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(3);

  const rows = bookings ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = rows.filter((b) => ['pending', 'confirmed'].includes(b.status) && b.end_date >= today);
  const completed = rows.filter((b) => b.status === 'completed');
  const totalSpent = completed.reduce((sum, b) => sum + Number(b.total_amount_usd ?? 0), 0);
  const recent = upcoming.length ? upcoming.slice(0, 2) : rows.slice(0, 2);
  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'there';

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Your rentals</p>
          <h1 className="font-display mt-2 text-4xl tracking-tight text-slate-900">Welcome back, {displayName}</h1>
          <p className="mt-2 text-slate-500">Everything you need for your current and past car rentals.</p>
        </div>
        <Link href="/listings" className="primary-button">Find a car <span className="ml-2">→</span></Link>
      </div>

      <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Upcoming bookings', String(upcoming.length), 'View bookings', '/dashboard/bookings'],
          ['Completed trips', String(completed.length), 'View history', '/dashboard/bookings'],
          ['Total spent', formatDailyRateUsd(totalSpent), 'Completed rentals', '/dashboard/bookings'],
          ['All bookings', String(rows.length), 'Rental history', '/dashboard/bookings'],
        ].map(([label, value, hint, href]) => (
          <Link key={label} href={href} className="surface-card group p-5 transition hover:-translate-y-0.5 hover:border-emerald-200">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">{label}</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
            <p className="mt-2 text-sm font-medium text-emerald-700">{hint} <span className="transition group-hover:translate-x-0.5">→</span></p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.65fr_.85fr]">
        <section className="surface-card p-6 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div><p className="eyebrow">Next up</p><h2 className="mt-1 text-xl font-semibold text-slate-900">Your bookings</h2></div>
            <Link href="/dashboard/bookings" className="text-sm font-semibold text-emerald-700">View all →</Link>
          </div>

          <div className="mt-6 space-y-3">
            {recent.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M5 16h14M6 16l1 2h10l1-2M6 13l2-5h8l2 5M5 13h14v3H5v-3Z" /></svg>
                </div>
                <p className="mt-4 font-semibold text-slate-800">No bookings yet</p>
                <p className="mt-1 text-sm text-slate-500">When you book a car, your trip details will appear here.</p>
                <Link href="/listings" className="mt-5 inline-flex text-sm font-semibold text-emerald-700">Browse cars →</Link>
              </div>
            ) : recent.map((booking) => {
              const rawCar = booking.cars;
              const car = (Array.isArray(rawCar) ? rawCar[0] : rawCar) as { id?: string; make?: string; model?: string; year?: number; image_urls?: string[]; daily_rate_usd?: number; location_city?: string; car_type?: string } | null;
              const imageUrl = car ? carListingImageUrl({ image_urls: car.image_urls, car_type: car.car_type ?? 'other' }) : null;
              return (
                <Link href={`/dashboard/bookings/${booking.id}`} key={booking.id} className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition hover:border-emerald-100 hover:bg-emerald-50/30 sm:flex-row sm:items-center">
                  {imageUrl && <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:w-32"><Image src={imageUrl} alt={`${car?.make ?? ''} ${car?.model ?? ''}`} fill className="object-cover" sizes="128px" /></div>}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div><p className="font-semibold text-slate-900">{car?.make} {car?.model} <span className="font-normal text-slate-500">({car?.year})</span></p><p className="mt-1 text-sm text-slate-500">{booking.start_date} → {booking.end_date} · {car?.location_city}</p></div>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${statusBadge(booking.status)}`}>{booking.status}</span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-emerald-800">{formatDailyRateUsd(Number(booking.total_amount_usd))}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <aside className="relative overflow-hidden rounded-[1.4rem] bg-emerald-900 p-7 text-white shadow-[0_18px_40px_rgba(21,94,66,0.18)]">
          <div className="absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-emerald-500/20" />
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">Need a car soon?</p>
          <h2 className="font-display mt-3 text-3xl leading-tight">Find the right car for your next trip.</h2>
          <p className="mt-4 text-sm leading-6 text-emerald-100/80">Browse available vehicles, compare rates, and choose dates that work for you.</p>
          <Link href="/listings" className="relative mt-7 inline-flex rounded-xl bg-white px-4 py-3 text-sm font-semibold text-emerald-900 shadow-sm">Browse cars →</Link>
        </aside>
      </div>

      {(recommendedCars ?? []).length > 0 && (
        <section className="mt-12">
          <div className="flex items-end justify-between gap-4"><div><p className="eyebrow">For your next trip</p><h2 className="font-display mt-2 text-3xl text-slate-900">Recommended for you</h2></div><Link href="/listings" className="text-sm font-semibold text-emerald-700">View all cars →</Link></div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{(recommendedCars ?? []).map((car) => <CarCard key={car.id} car={car} />)}</div>
        </section>
      )}
    </div>
  );
}
