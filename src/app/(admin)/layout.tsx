import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/dashboard');

  return (
    <div className="flex min-h-screen bg-[#f3f5f1]">
      <AdminSidebar email={user.email} />
      <main className="min-w-0 flex-1">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(209,250,229,0.36),transparent_34rem)] px-5 py-8 sm:px-8 sm:py-10 xl:px-12">
          {children}
        </div>
      </main>
    </div>
  );
}
