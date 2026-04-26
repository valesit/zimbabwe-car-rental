'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export function HeaderNav({
  isLoggedIn,
  isAdmin,
}: {
  isLoggedIn: boolean;
  isAdmin: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const mobileLink =
    'block rounded-lg px-3 py-3 text-base font-medium text-gray-800 transition hover:bg-teal-50 hover:text-teal-700';
  const desktopLink =
    'text-sm font-medium text-gray-600 transition hover:text-teal-600 whitespace-nowrap';

  return (
    <div className="flex flex-col">
      <div className="flex min-h-[3.25rem] items-center justify-between gap-3 py-2 sm:min-h-16 sm:py-0">
        <Link
          href="/"
          className="font-brand min-w-0 flex-1 text-base font-medium leading-snug tracking-tight text-teal-600 sm:flex-none sm:text-xl sm:leading-normal"
        >
          Rental Car Connect
        </Link>

        <button
          type="button"
          className="inline-flex shrink-0 items-center justify-center rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 md:hidden"
          aria-expanded={menuOpen}
          aria-controls="site-mobile-nav"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        <div className="hidden items-center gap-4 md:flex md:gap-6">
          <Link href="/listings" className={desktopLink}>
            Browse cars
          </Link>
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className={desktopLink}>
                Dashboard
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-sm font-medium text-amber-600 hover:text-amber-700 whitespace-nowrap"
                >
                  Admin
                </Link>
              )}
              <form action="/auth/signout" method="post">
                <button type="submit" className={desktopLink}>
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={desktopLink}>
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 whitespace-nowrap"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>

      {menuOpen ? (
        <div
          id="site-mobile-nav"
          className="border-t border-gray-100 pb-4 pt-1 md:hidden"
          role="navigation"
          aria-label="Mobile"
        >
          <div className="flex flex-col gap-0.5">
            <Link href="/listings" className={mobileLink} onClick={() => setMenuOpen(false)}>
              Browse cars
            </Link>
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className={mobileLink} onClick={() => setMenuOpen(false)}>
                  Dashboard
                </Link>
                {isAdmin && (
                  <Link href="/admin" className={mobileLink + ' text-amber-700'} onClick={() => setMenuOpen(false)}>
                    Admin
                  </Link>
                )}
                <form action="/auth/signout" method="post">
                  <button type="submit" className={mobileLink + ' w-full text-left'}>
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className={mobileLink} onClick={() => setMenuOpen(false)}>
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="mt-2 block rounded-xl bg-teal-600 px-4 py-3 text-center text-base font-semibold text-white shadow-md hover:bg-teal-700"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
