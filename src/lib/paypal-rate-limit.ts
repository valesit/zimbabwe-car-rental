/**
 * Best-effort per-user rate limits for PayPal API routes.
 * In-memory only (resets per server instance); for strict global limits use Redis/Upstash.
 */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_CREATE_ORDER = 20;
const MAX_CAPTURE_ORDER = 30;

type Bucket = { count: number; windowStart: number };

const createOrderBuckets = new Map<string, Bucket>();
const captureOrderBuckets = new Map<string, Bucket>();

function allow(map: Map<string, Bucket>, key: string, max: number): boolean {
  const now = Date.now();
  const e = map.get(key);
  if (!e || now - e.windowStart >= WINDOW_MS) {
    map.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (e.count >= max) return false;
  e.count += 1;
  return true;
}

export function allowPayPalCreateOrder(userId: string): boolean {
  return allow(createOrderBuckets, userId, MAX_CREATE_ORDER);
}

export function allowPayPalCaptureOrder(userId: string): boolean {
  return allow(captureOrderBuckets, userId, MAX_CAPTURE_ORDER);
}
