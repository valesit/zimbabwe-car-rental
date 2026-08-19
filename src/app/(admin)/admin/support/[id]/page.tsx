import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminTicketForm } from '@/components/AdminTicketForm';

function statusBadge(status: string) {
  const map: Record<string, string> = {
    open: 'bg-amber-50 text-amber-800 ring-amber-200',
    in_progress: 'bg-sky-50 text-sky-800 ring-sky-200',
    resolved: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    closed: 'bg-slate-100 text-slate-600 ring-slate-200',
  };
  return map[status] ?? 'bg-slate-100 text-slate-700 ring-slate-200';
}

export default async function AdminSupportTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: ticket, error } = await supabase
    .from('support_tickets')
    .select(`
      id, subject, message, status, admin_notes, created_at, updated_at, user_id,
      user:user_id (display_name)
    `)
    .eq('id', id)
    .single();

  if (error || !ticket) notFound();
  const rawUser = ticket.user;
  const customer = (Array.isArray(rawUser) ? rawUser[0] : rawUser) as { display_name?: string | null } | null;

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/admin/support" className="text-sm font-semibold text-emerald-800 hover:text-emerald-950">
        ← Support queue
      </Link>
      <header className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Customer request</p>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ${statusBadge(ticket.status)}`}>
              {ticket.status.replace('_', ' ')}
            </span>
          </div>
          <h1 className="font-display mt-3 text-4xl font-medium tracking-[-0.035em] text-slate-950 sm:text-5xl">{ticket.subject}</h1>
          <p className="mt-3 text-sm text-slate-500">
            From {customer?.display_name ?? 'Customer'} · {new Date(ticket.created_at).toLocaleString()} · #{String(ticket.id).slice(0, 8).toUpperCase()}
          </p>
        </div>
      </header>

      <div className="mt-8 grid gap-7 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_20px_50px_-40px_rgba(15,23,42,0.5)]">
          <div className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Customer message</p>
            <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-slate-700">{ticket.message}</p>
          </div>
          {ticket.admin_notes ? (
            <div className="border-t border-emerald-100 bg-emerald-50/60 p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Current response</p>
              <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-emerald-950/85">{ticket.admin_notes}</p>
              {ticket.updated_at ? <p className="mt-4 text-xs text-emerald-800/60">Last updated {new Date(ticket.updated_at).toLocaleString()}</p> : null}
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.5)] sm:p-8">
          <AdminTicketForm ticketId={id} status={ticket.status} adminNotes={ticket.admin_notes} />
        </section>
      </div>
    </div>
  );
}
