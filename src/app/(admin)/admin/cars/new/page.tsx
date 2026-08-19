import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CarForm } from '@/components/CarForm';

export default async function AdminNewCarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: cities } = await supabase.from('cities').select('name').order('name');

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/admin/cars" className="text-sm font-semibold text-emerald-700">← Fleet</Link>
      <div className="mt-5"><p className="eyebrow">Fleet management</p><h1 className="font-display mt-2 text-4xl tracking-tight text-slate-900">Add new car</h1><p className="mt-2 text-slate-500">Create a customer-ready vehicle listing for the Rental Car Connect fleet.</p></div>
      <CarForm cities={cities ?? []} imageStorageOwnerId={user.id} redirectPath="/admin/cars" />
    </div>
  );
}
