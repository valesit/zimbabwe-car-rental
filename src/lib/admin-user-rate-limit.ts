/** Per-admin rate limit for POST /api/admin/users (in-memory, best-effort). */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 15;

type Bucket = { count: number; windowStart: number };

const buckets = new Map<string, Bucket>();

export function allowAdminCreateUser(adminId: string): boolean {
  const now = Date.now();
  const e = buckets.get(adminId);
  if (!e || now - e.windowStart >= WINDOW_MS) {
    buckets.set(adminId, { count: 1, windowStart: now });
    return true;
  }
  if (e.count >= MAX_PER_WINDOW) return false;
  e.count += 1;
  return true;
}
