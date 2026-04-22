import { createServiceRoleClient } from '@/lib/supabase/admin';

/**
 * Fetches sign-in email(s) for renter user ids (Auth) — server-only, admin use.
 * Returns a map; missing or failed lookups get null.
 */
export async function getRenterAuthEmails(renterIds: string[]): Promise<Record<string, string | null>> {
  if (renterIds.length === 0) return {};
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const id of renterIds) {
    if (!seen.has(id)) {
      seen.add(id);
      unique.push(id);
    }
  }
  const admin = createServiceRoleClient();
  const out: Record<string, string | null> = {};

  await Promise.all(
    unique.map(async (id) => {
      try {
        const { data, error } = await admin.auth.admin.getUserById(id);
        if (error || !data?.user) {
          out[id] = null;
        } else {
          out[id] = data.user.email ?? null;
        }
      } catch {
        out[id] = null;
      }
    })
  );

  return out;
}
