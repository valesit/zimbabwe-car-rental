import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { formatDailyRateUsd } from '@/lib/money';
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

export default async function BookingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`id, start_date, end_date, status, total_amount_usd, car_id, cars (id, make, model, year, image_urls, location_city, car_type)`)
    .eq('renter_id', user.id)
    .order('created_at', { ascending: false });

  const rows = bookings ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const groups = [
    { title: 'Upcoming', rows: rows.filter((b) => ['pending', 'confirmed'].includes(b.status) && b.end_date >= today) },
    { title: 'Completed', rows: rows.filter((b) => b.status === 'completed') },
    { title: 'Cancelled', rows: rows.filter((b) => b.status === 'cancelled') },
  ].filter((group) => group.rows.length > 0);

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/dashboard" className="text-sm font-semibold text-emerald-700">← Overview</Link>
      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="eyebrow">Rental history</p><h1 className="font-display mt-2 text-4xl tracking-tight text-slate-900">My bookings</h1><p className="mt-2 text-slate-500">Track upcoming trips and revisit your previous rentals.</p></div>
        <Link href="/listings" className="primary-button">Book another car</Link>
      </div>

      {rows.length === 0 ? (
        <div className="surface-card mt-9 px-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M5 16h14M6 16l1 2h10l1-2M6 13l2-5h8l2 5M5 13h14v3H5v-3Z" /></svg></div>
          <h2 className="mt-5 text-lg font-semibold text-slate-900">Your first trip starts here</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Choose your dates, find a vehicle, and your booking will be available here from request through completion.</p>
          <Link href="/listings" className="primary-button mt-6">Browse available cars</Link>
        </div>
      ) : (
        <div className="mt-9 space-y-10">
          {groups.map((group) => (
            <section key={group.title}>
              <div className="mb-4 flex items-center gap-3"><h2 className="text-lg font-semibold text-slate-900">{group.title}</h2><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">{group.rows.length}</span></div>
              <div className="space-y-4">
                {group.rows.map((booking) => {
                  const rawCar = booking.cars;
                  const car = (Array.isArray(rawCar) ? rawCar[0] : rawCar) as { make?: string; model?: string; year?: number; image_urls?: string[]; location_city?: string; car_type?: string } | null;
                  const imageUrl = car ? carListingImageUrl({ image_urls: car.image_urls, car_type: car.car_type ?? 'other' }) : null;
                  return (
                    <div key={booking.id} className="surface-card flex flex-col overflow-hidden sm:flex-row">
                      {imageUrl && <div className="relative h-52 w-full shrink-0 bg-slate-100 sm:h-auto sm:w-60"><Image src={imageUrl} alt={`${car?.make ?? ''} ${car?.model ?? ''}`} fill className="object-cover" sizes="240px" /></div>}
                      <div className="flex flex-1 flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3"><h3 className="text-lg font-semibold text-slate-900">{car?.make} {car?.model} <span className="font-normal text-slate-500">({car?.year})</span></h3><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${statusBadge(booking.status)}`}>{booking.status}</span></div>
                          <div className="mt-4 grid gap-3 text-sm text-slate-500 sm:grid-cols-2">
                            <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Rental dates</p><p className="mt-1 font-medium text-slate-700">{booking.start_date} → {booking.end_date}</p></div>
                            <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Location</p><p className="mt-1 font-medium text-slate-700">{car?.location_city ?? 'Harare'}</p></div>
                          </div>
                          <p className="mt-4 text-lg font-semibold text-emerald-800">{formatDailyRateUsd(Number(booking.total_amount_usd))}</p>
                        </div>
                        <Link href={`/dashboard/bookings/${booking.id}`} className="secondary-button shrink-0">View details →</Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
