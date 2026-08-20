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
    'block rounded-xl px-3 py-3 text-base font-medium tracking-[-0.01em] text-[#243c33] transition-colors hover:bg-emerald-50 hover:text-[#155f45]';
  const desktopLink =
    'whitespace-nowrap rounded-lg px-2.5 py-2 text-[16px] font-semibold tracking-[-0.02em] text-[#263b33] transition-colors hover:text-[#176447]';
  const accountLink =
    'whitespace-nowrap text-[15px] font-semibold tracking-[-0.015em] text-[#26362f] transition-colors duration-200 hover:text-[#176a4b]';

  return (
    <div className="flex flex-col">
      <div className="flex min-h-[5.25rem] items-center justify-between gap-4 py-2">
        <Link
          href="/"
          className="group flex min-w-0 flex-1 items-center gap-3 text-[#18553f] transition-colors hover:text-[#0f4633] sm:flex-none"
          aria-label="Rental Car Connect home"
        >
          <span className="font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#287056]/45 bg-white text-sm font-semibold tracking-[-0.04em] shadow-[0_8px_22px_-18px_rgba(15,70,51,0.6)] sm:h-11 sm:w-11">
            RCC
          </span>
          <span className="font-display truncate text-xl font-semibold tracking-[-0.035em] sm:text-[1.65rem]">
            Rental Car Connect
          </span>
        </Link>

        <button
          type="button"
          className="inline-flex shrink-0 items-center justify-center rounded-xl border border-[#e1e7e3] p-2 text-[#42534c] transition hover:bg-[#f8fbf9] hover:text-slate-950 md:hidden"
          aria-expanded={menuOpen}
          aria-controls="site-mobile-nav"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        <div className="hidden items-center gap-5 md:flex lg:gap-7">
          <nav className="flex items-center gap-3 lg:gap-5" aria-label="Primary">
            <Link href="/listings" className={desktopLink}>Browse cars</Link>
            <Link href="/#how-it-works" className={desktopLink}>How it works</Link>
            <Link href="/#why-us" className={desktopLink}>Why us</Link>
          </nav>

          <div className="flex items-center gap-5 border-l border-[#e4e9e6] pl-5 lg:gap-6 lg:pl-7">
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className={accountLink}>Dashboard</Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="whitespace-nowrap text-[15px] font-semibold tracking-[-0.015em] text-amber-700 transition-colors hover:text-amber-800"
                  >
                    Admin
                  </Link>
                )}
                <form action="/auth/signout" method="post">
                  <button type="submit" className={accountLink}>Sign out</button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className={accountLink}>Sign in</Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center whitespace-nowrap rounded-xl bg-[#176447] px-5 py-3 text-[15px] font-semibold tracking-[-0.01em] text-white shadow-[0_12px_24px_-16px_rgba(18,88,62,0.65)] transition hover:bg-[#125239]"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {menuOpen ? (
        <div
          id="site-mobile-nav"
          className="border-t border-[#edf1ee] pb-4 pt-2 md:hidden"
          role="navigation"
          aria-label="Mobile"
        >
          <div className="flex flex-col gap-0.5">
            <Link href="/listings" className={mobileLink} onClick={() => setMenuOpen(false)}>Browse cars</Link>
            <Link href="/#how-it-works" className={mobileLink} onClick={() => setMenuOpen(false)}>How it works</Link>
            <Link href="/#why-us" className={mobileLink} onClick={() => setMenuOpen(false)}>Why us</Link>
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className={mobileLink} onClick={() => setMenuOpen(false)}>Dashboard</Link>
                {isAdmin && (
                  <Link href="/admin" className={mobileLink + ' text-amber-700'} onClick={() => setMenuOpen(false)}>Admin</Link>
                )}
                <form action="/auth/signout" method="post">
                  <button type="submit" className={mobileLink + ' w-full text-left'}>Sign out</button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className={mobileLink + ' font-semibold'} onClick={() => setMenuOpen(false)}>Sign in</Link>
                <Link
                  href="/signup"
                  className="mt-2 block rounded-xl bg-[#176447] px-4 py-3 text-center text-base font-semibold text-white shadow-sm transition hover:bg-[#125239]"
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
