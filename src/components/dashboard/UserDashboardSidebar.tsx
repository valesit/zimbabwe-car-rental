'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { href: '/dashboard', label: 'Overview', icon: IconHome, end: true },
  { href: '/dashboard/bookings', label: 'My bookings', icon: IconTicket },
  { href: '/support', label: 'Support', icon: IconLifebuoy },
];

export function UserDashboardSidebar({ email, showAdminLink }: { email?: string | null; showAdminLink?: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="border-b border-slate-100 px-5 py-6">
        <Link href="/" className="flex items-center gap-2 text-base font-semibold tracking-tight text-emerald-800">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-800 text-white"><IconCar className="h-4 w-4" /></span>
          Rental Car Connect
        </Link>
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Your account</p>
        {email && <p className="mt-1 truncate text-xs text-slate-500" title={email}>{email}</p>}
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {nav.map(({ href, label, icon: Icon, end }) => {
          const active = end ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition ${active ? 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
              <Icon className="h-5 w-5 shrink-0" />{label}
            </Link>
          );
        })}
        {showAdminLink && (
          <Link href="/admin" className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 px-3.5 py-3 text-sm font-semibold text-emerald-800">
            <IconShield className="h-5 w-5" /> Admin dashboard
          </Link>
        )}
      </nav>

      <div className="space-y-2 border-t border-slate-100 p-4">
        <Link href="/listings" className="secondary-button w-full">Browse cars</Link>
        <form action="/auth/signout" method="post"><button type="submit" className="w-full rounded-xl py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-800">Sign out</button></form>
      </div>
    </aside>
  );
}

function IconHome({ className }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-9Z" /></svg>; }
function IconTicket({ className }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4 6h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4V6Zm8 2v2m0 4v2" /></svg>; }
function IconCar({ className }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M5 16h14M6 16l1 2h10l1-2M6 13l2-5h8l2 5M5 13h14v3H5v-3Z" /></svg>; }
function IconLifebuoy({ className }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6.36-1.64 3.53-3.53m5.66 0 3.53 3.53m-3.53-5.19 3.53-3.53M9.17 14.83l-3.53 3.53" /></svg>; }
function IconShield({ className }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="m12 3 8 3v5c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V6l8-3Zm-3 9 2 2 4-4" /></svg>; }
