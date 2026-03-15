import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/Header';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') redirect('/dashboard');

  return (
    <>
      <Header />
      <nav className="border-b border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-10 gap-6">
            <Link href="/admin" className="inline-flex items-center border-b-2 border-transparent px-1 pt-px text-sm font-medium text-gray-900">
              Overview
            </Link>
            <Link href="/admin/cars" className="inline-flex items-center border-b-2 border-transparent px-1 pt-px text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
              Cars
            </Link>
            <Link href="/admin/users" className="inline-flex items-center border-b-2 border-transparent px-1 pt-px text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
              Users
            </Link>
            <Link href="/admin/support" className="inline-flex items-center border-b-2 border-transparent px-1 pt-px text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
              Support
            </Link>
          </div>
        </div>
      </nav>
      <main className="min-h-screen">{children}</main>
    </>
  );
}
