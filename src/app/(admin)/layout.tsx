import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/dashboard');

  return (
    <div className="flex min-h-screen bg-[#f6f8f5]">
      <AdminSidebar email={user.email} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <Link href="/admin" className="font-semibold text-emerald-900">Rental Car Connect · Admin</Link>
          <div className="flex gap-4 text-sm font-medium"><Link href="/admin/cars" className="text-slate-600">Fleet</Link><Link href="/admin/bookings" className="text-slate-600">Bookings</Link></div>
        </div>
        <main className="min-h-screen px-4 py-8 sm:px-7 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
