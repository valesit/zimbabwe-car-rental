import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { formatDailyRateUsd } from '@/lib/money';
import { ToggleCarActiveButton } from '@/components/ToggleCarActiveButton';
import { carListingImageUrl } from '@/lib/carImages';

export default async function AdminCarsPage() {
  const supabase = await createClient();
  const { data: cars } = await supabase
    .from('cars')
    .select(`id, make, model, year, car_type, location_city, daily_rate_usd, is_active, owner_id, image_urls, profiles:owner_id (display_name)`)
    .order('created_at', { ascending: false });

  const total = (cars ?? []).length;
  const active = (cars ?? []).filter((car) => car.is_active).length;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="eyebrow">Fleet management</p><h1 className="font-display mt-2 text-4xl tracking-tight text-slate-900">Cars</h1><p className="mt-2 text-slate-500">Add, edit, publish, or remove vehicles from the rental fleet.</p></div>
        <Link href="/admin/cars/new" className="primary-button"><span className="mr-2 text-lg leading-none">+</span>Add new car</Link>
      </div>

      <div className="mt-8 grid max-w-xl grid-cols-2 gap-4">
        <div className="surface-card p-5"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total vehicles</p><p className="mt-2 text-2xl font-semibold text-slate-900">{total}</p></div>
        <div className="surface-card p-5"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active listings</p><p className="mt-2 text-2xl font-semibold text-emerald-800">{active}</p></div>
      </div>

      <div className="surface-card mt-7 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-[#fafbf9]">
              <tr>
                {['Vehicle', 'Type', 'Location', 'Price / day', 'Status', 'Actions'].map((label) => <th key={label} className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {(cars ?? []).length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center"><p className="font-semibold text-slate-800">No cars in the fleet yet</p><Link href="/admin/cars/new" className="mt-2 inline-flex text-sm font-semibold text-emerald-700">Add your first car →</Link></td></tr>
              ) : (cars ?? []).map((car) => {
                const imageUrl = carListingImageUrl(car);
                return (
                  <tr key={car.id} className="transition hover:bg-emerald-50/20">
                    <td className="px-5 py-4"><div className="flex min-w-[230px] items-center gap-3"><div className="relative h-14 w-20 overflow-hidden rounded-xl bg-slate-100"><Image src={imageUrl} alt={`${car.make} ${car.model}`} fill className="object-cover" sizes="80px" /></div><div><Link href={`/listings/${car.id}`} className="font-semibold text-slate-900 hover:text-emerald-800">{car.make} {car.model}</Link><p className="mt-0.5 text-xs text-slate-500">{car.year}</p></div></div></td>
                    <td className="px-5 py-4 text-sm capitalize text-slate-600">{car.car_type}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{car.location_city}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">{formatDailyRateUsd(Number(car.daily_rate_usd))}</td>
                    <td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${car.is_active ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'}`}>{car.is_active ? 'Active' : 'Hidden'}</span></td>
                    <td className="px-5 py-4"><div className="flex min-w-[150px] items-center gap-2"><Link href={`/admin/cars/${car.id}/edit`} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-emerald-200 hover:text-emerald-800">Edit</Link><ToggleCarActiveButton carId={car.id} isActive={car.is_active} /></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
