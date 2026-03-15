import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from('profiles').select('role, is_verified, is_premium').eq('id', user.id).single()
    : { data: null };

  const isAdmin = profile?.role === 'admin';

  return (
    <header className="border-b border-gray-200/80 bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-brand text-xl font-medium tracking-tight text-teal-600">
          Skyrise Car Rental
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/listings"
            className="text-sm font-medium text-gray-600 transition hover:text-teal-600"
          >
            Browse cars
          </Link>
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-600 transition hover:text-teal-600"
              >
                Dashboard
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-sm font-medium text-amber-600 hover:text-amber-700"
                >
                  Admin
                </Link>
              )}
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-sm font-medium text-gray-600 transition hover:text-slate-800"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 transition hover:text-teal-600"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
