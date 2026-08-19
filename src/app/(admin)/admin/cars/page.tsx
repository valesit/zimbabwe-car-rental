import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatDailyRateUsd } from '@/lib/money';
import { carListingImageUrl } from '@/lib/carImages';
import { getCarTypeLabel } from '@/types/database';
import { ToggleCarActiveButton } from '@/components/ToggleCarActiveButton';

export default async function AdminCarsPage() {
  const supabase = await createClient();
  const { data: cars } = await supabase
    .from('cars')
    .select('id, make, model, year, car_type, location_city, daily_rate_usd, is_active, image_urls')
    .order('created_at', { ascending: false });

  const fleet = cars ?? [];
  const activeCount = fleet.filter((car) => car.is_active).length;
  const inactiveCount = fleet.length - activeCount;

  return (
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Fleet management</p>
          <h1 className="font-display mt-2 text-4xl font-medium tracking-[-0.035em] text-slate-950 sm:text-5xl">Your fleet</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Add vehicles, control visibility, update pricing and keep every listing ready for customers.
          </p>
        </div>
        <Link
          href="/admin/cars/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-950"
        >
          + Add new car
        </Link>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Total fleet" value={fleet.length} detail="All vehicles" />
        <Stat label="Active" value={activeCount} detail="Visible to customers" />
        <Stat label="Inactive" value={inactiveCount} detail="Hidden from booking" />
      </section>

      <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_20px_50px_-40px_rgba(15,23,42,0.5)]">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div>
            <h2 className="font-display text-2xl font-medium text-slate-950">Vehicles</h2>
            <p className="mt-1 text-sm text-slate-500">Manage the cars shown in the public fleet.</p>
          </div>
          <Link href="/listings" className="text-sm font-semibold text-emerald-800 hover:text-emerald-950">
            View public fleet →
          </Link>
        </div>

        {fleet.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-display text-2xl font-medium text-slate-950">Your fleet is empty.</p>
            <p className="mt-2 text-sm text-slate-500">Add the first vehicle to start accepting bookings.</p>
            <Link href="/admin/cars/new" className="mt-6 inline-flex rounded-xl bg-emerald-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-950">
              Add a vehicle
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Vehicle</th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Type</th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Location</th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Rate</th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Status</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fleet.map((car) => (
                  <tr key={car.id} className="transition hover:bg-emerald-50/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                          <Image
                            src={carListingImageUrl(car)}
                            alt={`${car.make} ${car.model}`}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </div>
                        <div className="min-w-0">
                          <Link href={`/listings/${car.id}`} className="font-semibold text-slate-950 hover:text-emerald-900">
                            {car.make} {car.model}
                          </Link>
                          <p className="mt-0.5 text-xs text-slate-400">{car.year}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">{getCarTypeLabel(car.car_type)}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{car.location_city}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                      {formatDailyRateUsd(Number(car.daily_rate_usd))}<span className="ml-1 text-xs font-normal text-slate-400">/ day</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${
                        car.is_active
                          ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
                          : 'bg-slate-100 text-slate-600 ring-slate-200'
                      }`}>
                        {car.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/cars/${car.id}/edit`}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-900"
                        >
                          Edit
                        </Link>
                        <ToggleCarActiveButton carId={car.id} isActive={car.is_active} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_16px_40px_-36px_rgba(15,23,42,0.5)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="font-display mt-2 text-3xl font-medium text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}
