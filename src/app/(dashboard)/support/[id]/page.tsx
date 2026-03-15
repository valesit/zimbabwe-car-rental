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
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/support" className="text-sm text-gray-600 hover:text-gray-900">
        &larr; Support
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">{ticket.subject}</h1>
      <p className="mt-2 text-sm text-gray-500">
        Status: {ticket.status} · Created {new Date(ticket.created_at).toLocaleString()}
      </p>
      <div className="mt-6 rounded-lg border border-gray-200 p-6">
        <p className="font-medium text-gray-700">Your message</p>
        <p className="mt-2 text-gray-700 whitespace-pre-wrap">{ticket.message}</p>
        {ticket.admin_notes && (
          <>
            <p className="mt-6 font-medium text-gray-700">Admin response</p>
            <p className="mt-2 text-gray-700 whitespace-pre-wrap">{ticket.admin_notes}</p>
          </>
        )}
      </div>
    </div>
  );
}
