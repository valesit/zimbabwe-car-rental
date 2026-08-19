import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { CarForm } from '@/components/CarForm';

export default async function AdminNewCarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: cities } = await supabase.from('cities').select('name').order('name');

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin/cars" className="text-sm font-semibold text-emerald-800 hover:text-emerald-950">
        ← Fleet
      </Link>
      <header className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Fleet management</p>
        <h1 className="font-display mt-2 text-4xl font-medium tracking-[-0.035em] text-slate-950 sm:text-5xl">Add a new car</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Create a polished listing with pricing, availability details and photos for the public fleet.
        </p>
      </header>

      <section className="mt-8 rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.5)] sm:p-8">
        <CarForm cities={cities ?? []} imageStorageOwnerId={user.id} returnTo="/admin/cars" />
      </section>
    </div>
  );
}
