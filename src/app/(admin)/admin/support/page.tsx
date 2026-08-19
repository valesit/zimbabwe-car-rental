import Link from 'next/link';
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

export default async function AdminSupportPage() {
  const supabase = await createClient();
  const { data: tickets } = await supabase
    .from('support_tickets')
    .select(`
      id, subject, message, status, created_at,
      user:user_id (display_name)
    `)
    .order('created_at', { ascending: false });

  const queue = tickets ?? [];
  const openCount = queue.filter((ticket) => ticket.status !== 'resolved' && ticket.status !== 'closed').length;
  const resolvedCount = queue.filter((ticket) => ticket.status === 'resolved' || ticket.status === 'closed').length;

  return (
    <div className="mx-auto max-w-7xl">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Customer care</p>
        <h1 className="font-display mt-2 text-4xl font-medium tracking-[-0.035em] text-slate-950 sm:text-5xl">Support queue</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">Review customer questions, respond clearly and keep unresolved rental issues visible to the team.</p>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Total requests" value={queue.length} detail="All support history" />
        <Stat label="Open" value={openCount} detail="Needs follow-up" />
        <Stat label="Resolved" value={resolvedCount} detail="Completed conversations" />
      </section>

      <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_20px_50px_-40px_rgba(15,23,42,0.5)]">
        <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
          <h2 className="font-display text-2xl font-medium text-slate-950">Customer requests</h2>
          <p className="mt-1 text-sm text-slate-500">Most recent requests appear first.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[850px] w-full divide-y divide-slate-100 text-left">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Request</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Customer</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Status</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Opened</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {queue.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <p className="font-display text-2xl font-medium text-slate-950">Support queue is clear.</p>
                    <p className="mt-2 text-sm text-slate-500">New customer requests will appear here.</p>
                  </td>
                </tr>
              ) : (
                queue.map((ticket) => {
                  const rawUser = ticket.user;
                  const customer = (Array.isArray(rawUser) ? rawUser[0] : rawUser) as { display_name?: string | null } | null;
                  return (
                    <tr key={ticket.id} className="transition hover:bg-emerald-50/25">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-950">{ticket.subject}</p>
                        <p className="mt-1 max-w-xl truncate text-xs text-slate-400">{ticket.message}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">{customer?.display_name ?? 'Customer'}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ${statusBadge(ticket.status)}`}>{ticket.status.replace('_', ' ')}</span>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-500">{new Date(ticket.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/support/${ticket.id}`}
                          className="inline-flex rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-900"
                        >
                          Open request
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_16px_40px_-36px_rgba(15,23,42,0.5)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="font-display mt-2 text-3xl font-medium text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}
