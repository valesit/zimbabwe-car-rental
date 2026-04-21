'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { href: '/dashboard', label: 'Overview', icon: IconHome, end: true },
  { href: '/dashboard/bookings', label: 'My bookings', icon: IconTicket },
  { href: '/dashboard/listings', label: 'My cars', icon: IconCar },
  { href: '/support', label: 'Support', icon: IconLifebuoy },
];

export function UserDashboardSidebar({
  email,
  showAdminLink,
}: {
  email?: string | null;
  showAdminLink?: boolean;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-gradient-to-b from-slate-50 to-white text-slate-800 shadow-sm">
      <div className="border-b border-slate-200 px-5 py-6">
        <Link href="/" className="font-brand text-lg font-semibold tracking-tight text-emerald-700">
          Rental Car Connect
        </Link>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Your account</p>
        {email && (
          <p className="mt-3 truncate text-xs text-slate-600" title={email}>
            {email}
          </p>
        )}
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {nav.map(({ href, label, icon: Icon, end }) => {
          const active = end ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'bg-emerald-100 text-emerald-900 shadow-sm ring-1 ring-emerald-200/80'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0 opacity-90" />
              {label}
            </Link>
          );
        })}
        {showAdminLink && (
          <Link
            href="/admin"
            className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-amber-700 ring-1 ring-amber-200/80 transition hover:bg-amber-50"
          >
            <IconShield className="h-5 w-5 shrink-0" />
            Admin
          </Link>
        )}
      </nav>
      <div className="space-y-2 border-t border-slate-200 p-4">
        <Link
          href="/listings"
          className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Browse cars
        </Link>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="w-full rounded-xl py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

function IconTicket({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a1 1 0 001 1h1a1 1 0 011 1v6a1 1 0 001 1h12a1 1 0 001-1v-6a1 1 0 011-1h1a1 1 0 001-1V7a2 2 0 00-2-2H5z"
      />
    </svg>
  );
}

function IconCar({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M8 17h8m-8 0a2 2 0 01-2-2V9h12v6a2 2 0 01-2 2m-8 0h8m-9-8V7a1 1 0 011-1h8a1 1 0 011 1v2M7 15h.01M17 15h.01"
      />
    </svg>
  );
}

function IconLifebuoy({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function IconShield({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}
