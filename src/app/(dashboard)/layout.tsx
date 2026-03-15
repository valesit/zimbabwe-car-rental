import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/Header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <>
      <Header />
      <main className="min-h-screen">{children}</main>
    </>
  );
}
