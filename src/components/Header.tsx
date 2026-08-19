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

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
      <nav className="page-shell">
        <HeaderNav isLoggedIn={Boolean(user)} isAdmin={profile?.role === 'admin'} />
      </nav>
    </header>
  );
}
