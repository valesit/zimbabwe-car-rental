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
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-semibold text-gray-900">
          Zimbabwe Car Rental
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/listings"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Browse cars
          </Link>
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
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
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
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
