import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function AdminSupportPage() {
  const supabase = await createClient();
  const { data: tickets } = await supabase
    .from('support_tickets')
    .select(`
      id, subject, message, status, created_at,
      user:user_id (display_name)
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-brand text-3xl font-semibold tracking-tight text-slate-900">Support tickets</h1>
      <p className="mt-1 text-slate-600">Customer requests and follow-up.</p>
      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/60">
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/80">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Subject</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">User</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Created</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(tickets ?? []).map((t) => {
              const user = Array.isArray(t.user) ? t.user[0] : t.user;
              return (
                <tr key={t.id} className="transition hover:bg-teal-50/30">
                  <td className="px-4 py-3 font-medium text-slate-800">{t.subject}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {(user as { display_name: string | null })?.display_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm">{t.status}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(t.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/support/${t.id}`}
                      className="text-sm font-medium text-gray-600 hover:underline"
                    >
                      View / Respond
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
