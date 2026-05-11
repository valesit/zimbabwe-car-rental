import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CarForm } from '@/components/CarForm';
import { AvailabilityEditor } from '@/components/AvailabilityEditor';

export default async function AdminEditCarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: car, error } = await supabase
    .from('cars')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !car) notFound();

  const { data: cities } = await supabase.from('cities').select('name').order('name');

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/cars" className="text-sm font-medium text-teal-700 hover:text-teal-900">
        &larr; Back to cars
      </Link>
      <h1 className="mt-4 font-brand text-3xl font-semibold tracking-tight text-slate-900">Edit listing</h1>
      <p className="mt-1 text-slate-600">Admin — changes apply to the owner&apos;s car.</p>
      <CarForm car={car} cities={cities ?? []} imageStorageOwnerId={car.owner_id} />
      <div className="mt-12 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Block dates (owner calendar)</h2>
        <p className="mt-1 text-sm text-slate-600">Same as owner tools: open by default, block specific ranges when needed.</p>
        <AvailabilityEditor carId={id} />
      </div>
    </div>
  );
}
