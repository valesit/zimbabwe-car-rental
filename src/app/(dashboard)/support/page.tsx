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
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard" className="text-sm font-medium text-emerald-700 hover:underline">
        ← Overview
      </Link>
      <h1 className="mt-4 font-brand text-3xl font-semibold tracking-tight text-slate-900">Support</h1>
      <p className="mt-1 text-slate-700">We’ll get back to you as soon as we can.</p>
      <NewTicketForm />
      <h2 className="mt-10 text-lg font-semibold text-slate-900">My tickets</h2>
      <ul className="mt-4 space-y-3">
        {(tickets ?? []).length === 0 ? (
          <li className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-slate-600">
            No support tickets yet.
          </li>
        ) : (
          (tickets ?? []).map((t) => (
            <li key={t.id} className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <Link href={`/support/${t.id}`} className="block hover:text-emerald-800">
                <p className="font-semibold text-slate-900">{t.subject}</p>
                <p className="mt-1 text-sm text-slate-700">
                  <span className="capitalize">{t.status}</span> · {new Date(t.created_at).toLocaleDateString()}
                </p>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
