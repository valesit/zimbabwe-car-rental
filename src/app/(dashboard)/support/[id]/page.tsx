import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function SupportTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: ticket, error } = await supabase
    .from('support_tickets')
    .select('id, subject, message, status, admin_notes, created_at, updated_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !ticket) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/support" className="text-sm font-medium text-emerald-700 hover:underline">
        ← Support
      </Link>
      <h1 className="mt-4 font-brand text-3xl font-semibold tracking-tight text-slate-900">{ticket.subject}</h1>
      <p className="mt-2 text-sm text-slate-700">
        <span className="capitalize">{ticket.status}</span> · Created {new Date(ticket.created_at).toLocaleString()}
      </p>
      <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <p className="font-semibold text-slate-900">Your message</p>
        <p className="mt-2 whitespace-pre-wrap text-slate-800">{ticket.message}</p>
        {ticket.admin_notes && (
          <>
            <p className="mt-6 font-semibold text-slate-900">Admin response</p>
            <p className="mt-2 whitespace-pre-wrap text-slate-800">{ticket.admin_notes}</p>
          </>
        )}
      </div>
    </div>
  );
}
