import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

function statusBadge(status: string) {
  const map: Record<string, string> = {
    open: 'bg-amber-50 text-amber-800 ring-amber-200',
    in_progress: 'bg-sky-50 text-sky-800 ring-sky-200',
    resolved: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    closed: 'bg-slate-100 text-slate-600 ring-slate-200',
  };
  return map[status] ?? 'bg-slate-100 text-slate-700 ring-slate-200';
}

export default async function SupportTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: ticket, error } = await supabase
    .from('support_tickets')
    .select('id, subject, message, status, admin_notes, created_at, updated_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !ticket) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/support" className="text-sm font-semibold text-emerald-800 hover:text-emerald-950">
        ← Support
      </Link>
      <header className="mt-5">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Support request</p>
          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ${statusBadge(ticket.status)}`}>
            {ticket.status.replace('_', ' ')}
          </span>
        </div>
        <h1 className="font-display mt-3 text-4xl font-medium tracking-[-0.035em] text-slate-950 sm:text-5xl">{ticket.subject}</h1>
        <p className="mt-3 text-sm text-slate-500">
          Opened {new Date(ticket.created_at).toLocaleString()} · Reference #{String(ticket.id).slice(0, 8).toUpperCase()}
        </p>
      </header>

      <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_20px_50px_-40px_rgba(15,23,42,0.5)]">
        <div className="p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Your message</p>
          <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-slate-700">{ticket.message}</p>
        </div>

        {ticket.admin_notes ? (
          <div className="border-t border-emerald-100 bg-emerald-50/60 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-900 text-sm font-semibold text-white">RC</div>
              <div>
                <p className="font-semibold text-emerald-950">Rental Car Connect</p>
                <p className="text-xs text-emerald-800/70">Support response</p>
              </div>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-emerald-950/85">{ticket.admin_notes}</p>
            {ticket.updated_at ? (
              <p className="mt-4 text-xs text-emerald-800/60">Updated {new Date(ticket.updated_at).toLocaleString()}</p>
            ) : null}
          </div>
        ) : (
          <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-5 sm:px-8">
            <p className="text-sm text-slate-500">Our support team has received your request and will respond here.</p>
          </div>
        )}
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/support" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-emerald-200 hover:text-emerald-900">
          Back to support
        </Link>
        <Link href="/dashboard/bookings" className="rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-950">
          View my bookings
        </Link>
      </div>
    </div>
  );
}
