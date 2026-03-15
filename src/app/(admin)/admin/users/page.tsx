import { createClient } from '@/lib/supabase/server';
import { UserRowActions } from '@/components/UserRowActions';

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, role, is_verified, is_premium, city, created_at')
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-800">Users</h1>
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Name</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Role</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">City</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Verified</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Premium</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {(profiles ?? []).map((p) => (
              <tr key={p.id}>
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
  );
}
