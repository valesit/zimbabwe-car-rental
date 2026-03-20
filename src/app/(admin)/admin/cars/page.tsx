import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatDailyRateUsd } from '@/lib/money';
import { ToggleCarActiveButton } from '@/components/ToggleCarActiveButton';

export default async function AdminCarsPage() {
  const supabase = await createClient();
  const { data: cars } = await supabase
    .from('cars')
    .select(`
      id, make, model, year, car_type, location_city, daily_rate_usd, is_active, owner_id,
      profiles:owner_id (display_name)
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-brand text-3xl font-semibold tracking-tight text-slate-900">Cars</h1>
      <p className="mt-1 text-slate-600">All listings — edit, toggle visibility, or view on the site.</p>
      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/60">
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/80">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Listing</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Owner</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Location</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Rate (USD)</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(cars ?? []).map((car) => {
              const owner = Array.isArray(car.profiles) ? car.profiles[0] : car.profiles;
              return (
                <tr key={car.id} className="transition hover:bg-teal-50/30">
                  <td className="px-4 py-3">
                    <Link href={`/listings/${car.id}`} className="font-medium text-slate-800 hover:text-teal-700 hover:underline">
                      {car.make} {car.model} ({car.year})
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {(owner as { display_name: string | null })?.display_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{car.location_city}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDailyRateUsd(Number(car.daily_rate_usd))}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {car.is_active ? (
                      <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">Active</span>
                    ) : (
                      <span className="inline-flex rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">Removed</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ToggleCarActiveButton carId={car.id} isActive={car.is_active} />
                    <Link
                      href={`/admin/cars/${car.id}/edit`}
                      className="ml-2 text-sm text-gray-600 hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
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
