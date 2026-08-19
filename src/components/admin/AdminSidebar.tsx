'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { href: '/admin', label: 'Overview', icon: IconChart },
  { href: '/admin/bookings', label: 'Bookings', icon: IconClipboard },
  { href: '/admin/cars', label: 'Fleet', icon: IconCar },
  { href: '/admin/users', label: 'Customers', icon: IconUsers },
  { href: '/admin/support', label: 'Support', icon: IconLifebuoy },
  { href: '/admin/promo', label: 'Site banner', icon: IconMegaphone },
];

export function AdminSidebar({ email }: { email?: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-[#10261f] text-white shadow-[12px_0_40px_-28px_rgba(2,44,34,0.7)] lg:w-72">
      <div className="border-b border-white/10 px-5 py-7 lg:px-6">
        <Link href="/" className="font-display text-xl font-medium tracking-[-0.02em] text-white">
          Rental Car Connect
        </Link>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">Admin console</p>
        {email ? (
          <p className="mt-4 truncate text-xs text-emerald-50/55" title={email}>
            {email}
          </p>
        ) : null}
      </div>

      <div className="p-4">
        <Link
          href="/admin/cars/new"
          className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-emerald-950 shadow-sm transition hover:bg-emerald-50"
        >
          <span className="text-lg leading-none">+</span> Add new car
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 pb-4 lg:px-4">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition ${
                active
                  ? 'bg-white/12 text-white shadow-sm ring-1 ring-white/10'
                  : 'text-emerald-50/65 hover:bg-white/7 hover:text-white'
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4 lg:p-5">
        <Link
          href="/"
          className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-emerald-50/75 transition hover:bg-white/10 hover:text-white"
        >
          ← Back to site
        </Link>
      </div>
    </aside>
  );
}

function IconClipboard({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 5H7a2 2 0 0 0-2 2v12h14V7a2 2 0 0 0-2-2h-2M9 5a3 3 0 0 1 6 0M9 5h6m-7 6h8m-8 4h5" />
    </svg>
  );
}

function IconChart({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4 19V9m5 10V5m5 14v-7m5 7V3" />
    </svg>
  );
}

function IconCar({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M5 16h14M6 16v2m12-2v2M4 12l2-5h12l2 5v4H4v-4Zm3 1h.01M17 13h.01" />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1m7-9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm9 9v-1a4 4 0 0 0-3-3.87M15 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconLifebuoy({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6.36 2.36 3.53-3.53m5.66-5.66 3.53-3.53m0 12.72-3.53-3.53M9.17 9.17 5.64 5.64" />
    </svg>
  );
}

function IconMegaphone({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4 11v2a2 2 0 0 0 2 2h2l2 5h3l-1-5 7-3V7L8 4v5H6a2 2 0 0 0-2 2Zm15-1h2" />
    </svg>
  );
}
