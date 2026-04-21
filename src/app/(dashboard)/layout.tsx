import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { UserDashboardSidebar } from '@/components/dashboard/UserDashboardSidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();

  return (
    <div className="flex min-h-screen bg-slate-100/90">
      <UserDashboardSidebar email={user.email} showAdminLink={profile?.role === 'admin'} />
      <div className="flex min-h-screen flex-1 flex-col">
        <div className="flex-1 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-50/50 via-transparent to-transparent px-4 py-8 sm:px-8 lg:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}
