'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { href: '/admin', label: 'Dashboard', icon: IconChart },
  { href: '/admin/cars', label: 'Fleet', icon: IconCar },
  { href: '/admin/bookings', label: 'Bookings', icon: IconClipboard },
  { href: '/admin/users', label: 'Customers', icon: IconUsers },
  { href: '/admin/support', label: 'Support', icon: IconLifebuoy },
  { href: '/admin/promo', label: 'Site content', icon: IconMegaphone },
];

export function AdminSidebar({ email }: { email?: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-[#fbfcfa] lg:flex">
      <div className="border-b border-slate-100 px-5 py-6">
        <Link href="/" className="flex items-center gap-2 text-base font-semibold tracking-tight text-emerald-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-900 text-white"><IconCar className="h-4 w-4" /></span>
          Rental Car Connect
        </Link>
        <div className="mt-5 flex items-center gap-2"><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-800">Admin</span></div>
        {email && <p className="mt-2 truncate text-xs text-slate-500" title={email}>{email}</p>}
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
          return <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition ${active ? 'bg-emerald-900 text-white shadow-sm' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}><Icon className="h-5 w-5 shrink-0" />{label}</Link>;
        })}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <Link href="/" className="secondary-button w-full">View public site</Link>
        <form action="/auth/signout" method="post" className="mt-2"><button className="w-full rounded-xl py-2.5 text-sm font-medium text-slate-500 hover:bg-white hover:text-slate-800" type="submit">Sign out</button></form>
      </div>
    </aside>
  );
}

function IconChart({ className }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4 20V10h4v10H4Zm6 0V4h4v16h-4Zm6 0v-7h4v7h-4Z" /></svg>; }
function IconClipboard({ className }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 5H7a2 2 0 0 0-2 2v12h14V7a2 2 0 0 0-2-2h-2M9 5a3 3 0 0 1 6 0M8 10h8m-8 4h8" /></svg>; }
function IconCar({ className }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M5 16h14M6 16l1 2h10l1-2M6 13l2-5h8l2 5M5 13h14v3H5v-3Z" /></svg>; }
function IconUsers({ className }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>; }
function IconLifebuoy({ className }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" /></svg>; }
function IconMegaphone({ className }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 11v2a2 2 0 0 0 2 2h2l3 5h2l-2-5 9-4V5l-9 4H5a2 2 0 0 0-2 2Zm16-2a3 3 0 0 1 0 6" /></svg>; }
