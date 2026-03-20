import { createClient } from '@/lib/supabase/server';
import { UserRowActions } from '@/components/UserRowActions';

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, role, is_verified, is_premium, city, created_at')
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-brand text-3xl font-semibold tracking-tight text-slate-900">Users</h1>
      <p className="mt-1 text-slate-600">Profiles, roles, and verification flags.</p>
      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/60">
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/80">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">City</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Verified</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Premium</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(profiles ?? []).map((p) => (
              <tr key={p.id} className="transition hover:bg-teal-50/30">
                <td className="px-4 py-3 font-medium text-slate-800">{p.display_name ?? '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{p.role}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{p.city ?? '—'}</td>
                <td className="px-4 py-3 text-sm">{p.is_verified ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3 text-sm">{p.is_premium ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3">
                  <UserRowActions
                    userId={p.id}
                    isVerified={p.is_verified}
                    isPremium={p.is_premium}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
