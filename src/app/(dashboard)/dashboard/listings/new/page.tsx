import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CarForm } from '@/components/CarForm';

export default async function NewListingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: cities } = await supabase.from('cities').select('name').order('name');

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard/listings" className="text-sm font-medium text-emerald-700 hover:underline">
        ← My cars
      </Link>
      <h1 className="mt-4 font-brand text-3xl font-semibold tracking-tight text-slate-900">Add a car</h1>
      <p className="mt-1 text-slate-700">List a vehicle for rent in Harare.</p>
      <CarForm cities={cities ?? []} imageStorageOwnerId={user.id} />
    </div>
  );
}
