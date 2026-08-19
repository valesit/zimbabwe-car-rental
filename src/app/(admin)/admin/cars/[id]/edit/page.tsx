import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CarForm } from '@/components/CarForm';

export default async function AdminEditCarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: car, error } = await supabase.from('cars').select('*').eq('id', id).single();
  if (error || !car) notFound();

  const { data: cities } = await supabase.from('cities').select('name').order('name');

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/admin/cars" className="text-sm font-semibold text-emerald-700">← Fleet</Link>
      <div className="mt-5"><p className="eyebrow">Fleet management</p><h1 className="font-display mt-2 text-4xl tracking-tight text-slate-900">Edit {car.make} {car.model}</h1><p className="mt-2 text-slate-500">Update listing details, pricing, location, and photos.</p></div>
      <CarForm car={car} cities={cities ?? []} imageStorageOwnerId={car.owner_id} redirectPath="/admin/cars" />
    </div>
  );
}
