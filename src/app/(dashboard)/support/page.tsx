import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { NewTicketForm } from '@/components/NewTicketForm';

function statusBadge(status: string) {
  const map: Record<string, string> = {
    open: 'bg-amber-50 text-amber-800 ring-amber-200',
    in_progress: 'bg-sky-50 text-sky-800 ring-sky-200',
    resolved: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    closed: 'bg-slate-100 text-slate-600 ring-slate-200',
  };
  return map[status] ?? 'bg-slate-100 text-slate-700 ring-slate-200';
}

export default async function SupportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('id, subject, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-7xl">
      <header>
        <Link href="/dashboard" className="text-sm font-semibold text-emerald-800 hover:text-emerald-950">
          ← Overview
        </Link>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Help center</p>
        <h1 className="font-display mt-2 text-4xl font-medium tracking-[-0.035em] text-slate-950 sm:text-5xl">Support</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Questions about a booking, payment or pick-up? Send us a message and keep track of the conversation here.
        </p>
      </header>

      <div className="mt-9 grid gap-7 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.5)] sm:p-8">
          <NewTicketForm />
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_20px_50px_-40px_rgba(15,23,42,0.5)]">
          <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">History</p>
            <h2 className="font-display mt-2 text-2xl font-medium text-slate-950">Your support requests</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {(tickets ?? []).length === 0 ? (
              <div className="px-6 py-14 text-center sm:px-8">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M8 10h8m-8 4h5M5 20l2.2-3H19a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2v3Z" />
                  </svg>
                </div>
                <p className="mt-4 font-medium text-slate-900">No support requests yet.</p>
                <p className="mt-1 text-sm text-slate-500">When you contact us, your requests will appear here.</p>
              </div>
            ) : (
              (tickets ?? []).map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/support/${ticket.id}`}
                  className="flex items-center justify-between gap-5 px-6 py-5 transition hover:bg-emerald-50/40 sm:px-8"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-950">{ticket.subject}</p>
                    <p className="mt-1 text-sm text-slate-500">Opened {new Date(ticket.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className={`hidden rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 sm:inline-flex ${statusBadge(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <span className="text-emerald-800" aria-hidden>→</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        <InfoCard title="Booking questions" text="Get help with dates, changes and rental details." />
        <InfoCard title="Pick-up support" text="Ask about locations, timing or optional delivery." />
        <InfoCard title="Payment help" text="We can help clarify charges, deposits and booking totals." />
      </section>
    </div>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-5">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-1.5 text-sm leading-6 text-slate-500">{text}</p>
    </div>
  );
}
