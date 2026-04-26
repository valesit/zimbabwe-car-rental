import { createClient } from '@/lib/supabase/server';
import { HeaderNav } from '@/components/HeaderNav';

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from('profiles').select('role, is_verified, is_premium').eq('id', user.id).single()
    : { data: null };

  const isAdmin = profile?.role === 'admin';

  return (
    <header className="border-b border-gray-200/80 bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <HeaderNav isLoggedIn={Boolean(user)} isAdmin={isAdmin} />
      </nav>
    </header>
  );
}
