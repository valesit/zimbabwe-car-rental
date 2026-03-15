import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const { count: carsCount } = await supabase.from('cars').select('*', { count: 'exact', head: true });
  const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  const { count: ticketsCount } = await supabase
    .from('support_tickets')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'resolved');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-800">Admin</h1>
      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        <Link href="/admin/cars" className="rounded-lg border border-gray-200 p-6 hover:bg-gray-50">
          <p className="text-2xl font-bold text-slate-800">{carsCount ?? 0}</p>
          <p className="text-gray-600">Cars</p>
        </Link>
        <Link href="/admin/users" className="rounded-lg border border-gray-200 p-6 hover:bg-gray-50">
          <p className="text-2xl font-bold text-slate-800">{usersCount ?? 0}</p>
          <p className="text-gray-600">Users</p>
        </Link>
        <Link href="/admin/support" className="rounded-lg border border-gray-200 p-6 hover:bg-gray-50">
          <p className="text-2xl font-bold text-slate-800">{ticketsCount ?? 0}</p>
          <p className="text-gray-600">Open support tickets</p>
        </Link>
      </div>
    </div>
  );
}
