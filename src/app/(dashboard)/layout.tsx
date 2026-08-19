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
    <div className="flex min-h-screen bg-[#f5f7f3]">
      <UserDashboardSidebar email={user.email} showAdminLink={profile?.role === 'admin'} />
      <main className="min-w-0 flex-1">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(209,250,229,0.42),transparent_32rem)] px-5 py-8 sm:px-8 sm:py-10 xl:px-12">
          {children}
        </div>
      </main>
    </div>
  );
}
