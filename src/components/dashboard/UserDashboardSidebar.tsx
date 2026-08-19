'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { href: '/dashboard', label: 'Overview', icon: IconHome, end: true },
  { href: '/dashboard/bookings', label: 'My bookings', icon: IconTicket },
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
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200/80 bg-[#fbfcf9] text-slate-800 shadow-[10px_0_35px_-30px_rgba(15,23,42,0.35)] lg:w-72">
      <div className="border-b border-slate-200/70 px-5 py-7 lg:px-6">
        <Link href="/" className="font-display text-xl font-medium tracking-[-0.02em] text-emerald-900">
          Rental Car Connect
        </Link>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Your trips</p>
        {email && (
          <p className="mt-4 truncate text-xs text-slate-500" title={email}>
            {email}
          </p>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3 lg:p-4">
        {nav.map(({ href, label, icon: Icon, end }) => {
          const active = end ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition ${
                active
                  ? 'bg-emerald-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white hover:text-slate-950 hover:shadow-sm'
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {label}
            </Link>
          );
        })}

        {showAdminLink && (
          <Link
            href="/admin"
            className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3.5 py-3 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100"
          >
            <IconShield className="h-[18px] w-[18px] shrink-0" />
            Admin console
          </Link>
        )}
      </nav>

      <div className="space-y-2 border-t border-slate-200/70 p-4 lg:p-5">
        <Link
          href="/listings"
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-900 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-950"
        >
          Browse cars
          <span aria-hidden>→</span>
        </Link>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="w-full rounded-xl py-2.5 text-sm font-medium text-slate-500 transition hover:bg-white hover:text-slate-900"
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
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 11.5 12 4l9 7.5M5.5 10.5V20h13v-9.5M9 20v-6h6v6" />
    </svg>
  );
}

function IconTicket({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2Zm7 2v10" />
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

function IconShield({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 3 5 6v5c0 4.7 2.9 8.9 7 10 4.1-1.1 7-5.3 7-10V6l-7-3Zm-3 9 2 2 4-4" />
    </svg>
  );
}
