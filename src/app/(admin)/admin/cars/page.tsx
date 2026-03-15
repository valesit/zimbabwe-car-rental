import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ToggleCarActiveButton } from '@/components/ToggleCarActiveButton';

export default async function AdminCarsPage() {
  const supabase = await createClient();
  const { data: cars } = await supabase
    .from('cars')
    .select(`
      id, make, model, year, car_type, location_city, daily_rate_zwl, is_active, owner_id,
      profiles:owner_id (display_name)
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-800">Cars</h1>
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Listing</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Owner</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Location</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Rate (ZWL)</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {(cars ?? []).map((car) => {
              const owner = Array.isArray(car.profiles) ? car.profiles[0] : car.profiles;
              return (
                <tr key={car.id}>
                  <td className="px-4 py-3">
                    <Link href={`/listings/${car.id}`} className="font-medium text-slate-800 hover:underline">
                      {car.make} {car.model} ({car.year})
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {(owner as { display_name: string | null })?.display_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{car.location_city}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {Number(car.daily_rate_zwl).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {car.is_active ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-red-600">Removed</span>
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
  );
}
