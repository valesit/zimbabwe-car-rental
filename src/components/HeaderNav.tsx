'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type NavGlyphKind = 'car' | 'steps' | 'shield';

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

        <div className="hidden items-center md:flex">
          <div className="flex items-stretch divide-x divide-[#dfe7e2]">
            <DesktopNavLink href="/listings" label="Browse cars" icon="car" />
            <DesktopNavLink href="/#how-it-works" label="How it works" icon="steps" />
            <DesktopNavLink href="/#why-us" label="Why us" icon="shield" />
          </div>

          <div className="ml-5 flex items-center gap-5 lg:ml-7 lg:gap-6">
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className={accountLink}>
                  Dashboard
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="whitespace-nowrap text-[15px] font-semibold tracking-[-0.015em] text-amber-700 transition-colors hover:text-amber-800"
                  >
                    Admin
                  </Link>
                )}
                <form action="/auth/signout" method="post">
                  <button type="submit" className={accountLink}>
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className={accountLink}>
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-[#176447] px-4 py-3 text-[15px] font-semibold tracking-[-0.01em] text-white shadow-[0_12px_24px_-16px_rgba(18,88,62,0.65)] transition hover:bg-[#125239]"
                >
                  <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.1a7.5 7.5 0 0115 0" />
                  </svg>
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
            <Link href="/listings" className={mobileLink} onClick={() => setMenuOpen(false)}>
              Browse cars
            </Link>
            <Link href="/#how-it-works" className={mobileLink} onClick={() => setMenuOpen(false)}>
              How it works
            </Link>
            <Link href="/#why-us" className={mobileLink} onClick={() => setMenuOpen(false)}>
              Why us
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
                <Link href="/login" className={mobileLink + ' font-semibold'} onClick={() => setMenuOpen(false)}>
                  Sign in
                </Link>
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

function DesktopNavLink({ href, label, icon }: { href: string; label: string; icon: NavGlyphKind }) {
  return (
    <Link
      href={href}
      className="group relative flex min-w-[112px] flex-col items-center justify-center gap-1.5 px-4 py-2 text-[#173d30] transition-colors hover:text-[#0f6847] lg:min-w-[128px] lg:px-5"
    >
      <NavGlyph type={icon} />
      <span className="text-[15px] font-semibold tracking-[-0.02em] lg:text-base">{label}</span>
      <span className="absolute inset-x-5 -bottom-2 h-0.5 origin-center scale-x-0 rounded-full bg-[#247157] transition-transform duration-200 group-hover:scale-x-100" aria-hidden="true" />
    </Link>
  );
}

function NavGlyph({ type }: { type: NavGlyphKind }) {
  if (type === 'car') {
    return (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M5 16.5h14M6.25 16.5l.65-5.15A2 2 0 018.88 9.6h6.24a2 2 0 011.98 1.75l.65 5.15M7.5 9.6l1.05-2.25A1.5 1.5 0 019.9 6.5h4.2a1.5 1.5 0 011.35.85L16.5 9.6M7 16.5v1.25M17 16.5v1.25M8.25 13.25h.01M15.75 13.25h.01" />
      </svg>
    );
  }

  if (type === 'steps') {
    return (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M12 3.75a8.25 8.25 0 108.25 8.25A8.25 8.25 0 0012 3.75zM8.75 12h6.5M12 8.75v6.5" />
      </svg>
    );
  }

  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M12 3.75l6.25 2.5v4.9c0 4.05-2.55 7.65-6.25 9.1-3.7-1.45-6.25-5.05-6.25-9.1v-4.9L12 3.75zM9.25 12l1.75 1.75 3.75-4" />
    </svg>
  );
}
