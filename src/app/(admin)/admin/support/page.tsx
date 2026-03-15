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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">Support tickets</h1>
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Subject</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">User</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Created</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {(tickets ?? []).map((t) => {
              const user = Array.isArray(t.user) ? t.user[0] : t.user;
              return (
                <tr key={t.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{t.subject}</td>
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
  );
}
