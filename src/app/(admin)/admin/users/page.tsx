import { createClient } from '@/lib/supabase/server';
import { AdminCreateUserForm } from '@/components/AdminCreateUserForm';
import { UserRowActions } from '@/components/UserRowActions';

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, role, is_verified, is_premium, city, created_at')
    .order('created_at', { ascending: false });

  const people = profiles ?? [];
  const customers = people.filter((person) => person.role === 'user');
  const admins = people.filter((person) => person.role === 'admin');
  const verified = customers.filter((person) => person.is_verified).length;

  return (
    <div className="mx-auto max-w-7xl">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Customer management</p>
        <h1 className="font-display mt-2 text-4xl font-medium tracking-[-0.035em] text-slate-950 sm:text-5xl">Customers</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Manage renter profiles, verification status and administrative access without mixing customer accounts with fleet ownership.
        </p>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Customers" value={customers.length} detail="Renter accounts" />
        <Stat label="Verified" value={verified} detail="Verified customers" />
        <Stat label="Administrators" value={admins.length} detail="Admin access" />
      </section>

      <div className="mt-7">
        <AdminCreateUserForm />
      </div>

      <section className="mt-7 overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_20px_50px_-40px_rgba(15,23,42,0.5)]">
        <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
          <h2 className="font-display text-2xl font-medium text-slate-950">Account directory</h2>
          <p className="mt-1 text-sm text-slate-500">Customer and administrator profiles registered on the platform.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full divide-y divide-slate-100 text-left">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Name</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Account type</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">City</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Verification</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Member since</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {people.map((person) => (
                <tr key={person.id} className="transition hover:bg-emerald-50/25">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-800 ring-1 ring-emerald-100">
                        {(person.display_name?.trim()?.charAt(0) || 'U').toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-950">{person.display_name ?? 'Unnamed account'}</p>
                        {person.is_premium ? <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-amber-700">Premium</p> : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${
                      person.role === 'admin'
                        ? 'bg-slate-900 text-white ring-slate-900'
                        : 'bg-slate-100 text-slate-600 ring-slate-200'
                    }`}>
                      {person.role === 'admin' ? 'Administrator' : 'Customer'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">{person.city ?? '—'}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${person.is_verified ? 'text-emerald-800' : 'text-slate-400'}`}>
                      <span className={`h-2 w-2 rounded-full ${person.is_verified ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      {person.is_verified ? 'Verified' : 'Not verified'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-500">{new Date(person.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <UserRowActions
                      userId={person.id}
                      role={person.role as 'admin' | 'user'}
                      currentAdminId={user?.id ?? ''}
                      isVerified={person.is_verified}
                      isPremium={person.is_premium}
                    />
                  </td>
                </tr>
              ))}
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
