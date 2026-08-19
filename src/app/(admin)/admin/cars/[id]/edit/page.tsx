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
  const { data: car, error } = await supabase.from('cars').select('*').eq('id', id).single();

  if (error || !car) notFound();

  const { data: cities } = await supabase.from('cities').select('name').order('name');

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin/cars" className="text-sm font-semibold text-emerald-800 hover:text-emerald-950">
        ← Fleet
      </Link>
      <header className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Fleet management</p>
          <h1 className="font-display mt-2 text-4xl font-medium tracking-[-0.035em] text-slate-950 sm:text-5xl">Edit {car.make} {car.model}</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">Update listing details, pricing and photography. Changes appear on the public fleet immediately.</p>
        </div>
        <Link
          href={`/listings/${car.id}`}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:text-emerald-900"
        >
          Preview listing →
        </Link>
      </header>

      <section className="mt-8 rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.5)] sm:p-8">
        <CarForm
          car={car}
          cities={cities ?? []}
          imageStorageOwnerId={car.owner_id}
          returnTo="/admin/cars"
        />
      </section>
    </div>
  );
}
