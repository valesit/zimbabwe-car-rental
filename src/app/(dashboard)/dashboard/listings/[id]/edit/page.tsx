import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { CarForm } from '@/components/CarForm';
import { AvailabilityEditor } from '@/components/AvailabilityEditor';

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: car, error } = await supabase
    .from('cars')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single();

  if (error || !car) notFound();

  const { data: cities } = await supabase.from('cities').select('name').order('name');

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard/listings" className="text-sm font-medium text-emerald-700 hover:underline">
        ← My cars
      </Link>
      <h1 className="mt-4 font-brand text-3xl font-semibold tracking-tight text-slate-900">
        Edit {car.make} {car.model}
      </h1>
      <CarForm car={car} cities={cities ?? []} imageStorageOwnerId={car.owner_id} />
      <div className="mt-12 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Block dates</h2>
        <p className="mt-1 text-sm text-slate-600">Optional — leave open unless you need to reserve time off the calendar.</p>
        <AvailabilityEditor carId={id} />
      </div>
    </div>
  );
}
