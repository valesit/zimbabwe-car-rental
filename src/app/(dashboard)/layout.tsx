import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { UserDashboardSidebar } from '@/components/dashboard/UserDashboardSidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();

  return (
    <div className="flex min-h-screen bg-[#f6f8f5]">
      <UserDashboardSidebar email={user.email} showAdminLink={profile?.role === 'admin'} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <Link href="/" className="font-semibold text-emerald-800">Rental Car Connect</Link>
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link href="/dashboard/bookings" className="text-slate-600">Bookings</Link>
            <Link href="/listings" className="text-emerald-700">Browse</Link>
          </div>
        </div>
        <main className="min-h-screen px-4 py-8 sm:px-7 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
