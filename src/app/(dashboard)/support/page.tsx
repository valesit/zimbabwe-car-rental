import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { NewTicketForm } from '@/components/NewTicketForm';

export default async function SupportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('id, subject, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
        &larr; Dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">Support</h1>
      <NewTicketForm />
      <h2 className="mt-8 text-lg font-semibold text-gray-900">My tickets</h2>
      <ul className="mt-4 space-y-3">
        {(tickets ?? []).length === 0 ? (
          <li className="text-gray-500">No support tickets yet.</li>
        ) : (
          (tickets ?? []).map((t) => (
            <li key={t.id} className="rounded-lg border border-gray-200 p-4">
              <Link href={`/support/${t.id}`} className="block">
                <p className="font-medium">{t.subject}</p>
                <p className="text-sm text-gray-500">
                  {t.status} · {new Date(t.created_at).toLocaleDateString()}
                </p>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
