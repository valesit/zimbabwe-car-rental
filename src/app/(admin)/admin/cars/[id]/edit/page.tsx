import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CarForm } from '@/components/CarForm';

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
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/admin/cars" className="text-sm text-gray-600 hover:text-slate-800">
        &larr; Cars
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-800">Edit car (admin)</h1>
      <CarForm car={car} cities={cities ?? []} />
    </div>
  );
}
