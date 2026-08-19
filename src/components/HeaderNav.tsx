'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export function HeaderNav({ isLoggedIn, isAdmin }: { isLoggedIn: boolean; isAdmin: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const navLink = 'text-sm font-medium text-slate-600 transition hover:text-emerald-800';
  const mobileLink = 'block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800';

  return (
    <div>
      <div className="flex h-[4.5rem] items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2 font-brand text-lg font-semibold tracking-tight text-emerald-800 sm:text-xl">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-800 text-white shadow-sm" aria-hidden="true">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M5 16h14M6.5 16l1 2h9l1-2M6 13l1.8-5h8.4L18 13M5 13h14v3H5v-3Zm2-2H5m12 0h2" />
            </svg>
          </span>
          Rental Car Connect
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          <Link href="/listings" className={navLink}>Browse cars</Link>
          <Link href="/#how-it-works" className={navLink}>How it works</Link>
          <Link href="/#why-us" className={navLink}>Why us</Link>
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className={navLink}>My trips</Link>
              {isAdmin && <Link href="/admin" className="text-sm font-semibold text-emerald-800">Admin</Link>}
              <form action="/auth/signout" method="post">
                <button type="submit" className={navLink}>Sign out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={navLink}>Sign in</Link>
              <Link href="/signup" className="primary-button !px-4 !py-2.5">Sign up</Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 md:hidden"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((value) => !value)}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18 18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-100 py-3 md:hidden">
          <Link href="/listings" className={mobileLink} onClick={() => setMenuOpen(false)}>Browse cars</Link>
          <Link href="/#how-it-works" className={mobileLink} onClick={() => setMenuOpen(false)}>How it works</Link>
          <Link href="/#why-us" className={mobileLink} onClick={() => setMenuOpen(false)}>Why us</Link>
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className={mobileLink} onClick={() => setMenuOpen(false)}>My trips</Link>
              {isAdmin && <Link href="/admin" className={mobileLink} onClick={() => setMenuOpen(false)}>Admin</Link>}
              <form action="/auth/signout" method="post"><button type="submit" className={`${mobileLink} w-full text-left`}>Sign out</button></form>
            </>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-2 px-1">
              <Link href="/login" className="secondary-button" onClick={() => setMenuOpen(false)}>Sign in</Link>
              <Link href="/signup" className="primary-button" onClick={() => setMenuOpen(false)}>Sign up</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
