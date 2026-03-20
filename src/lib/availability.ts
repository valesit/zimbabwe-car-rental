/** Days ahead we allow booking without explicit calendar rows (opt-out: only `is_available: false` blocks). */
export const BOOKING_HORIZON_DAYS = 400;

export interface AvailabilityRow {
  available_date: string;
  is_available: boolean;
}

export function toISODateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Dates the owner (or a booking) has marked unavailable */
export function buildBlockedSet(rows: AvailabilityRow[]): Set<string> {
  return new Set(rows.filter((r) => !r.is_available).map((r) => r.available_date));
}

export function horizonEndIso(todayIso: string, days = BOOKING_HORIZON_DAYS): string {
  const [y, m, d] = todayIso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return toISODateLocal(dt);
}

export function computeNextOpenDay(
  todayIso: string,
  horizonIso: string,
  blocked: Set<string>
): string | null {
  const [y, m, d] = todayIso.split('-').map(Number);
  const cursor = new Date(y, m - 1, d);
  const [ey, em, ed] = horizonIso.split('-').map(Number);
  const end = new Date(ey, em - 1, ed);

  while (cursor <= end) {
    const iso = toISODateLocal(cursor);
    if (!blocked.has(iso)) return iso;
    cursor.setDate(cursor.getDate() + 1);
  }
  return null;
}

/** At least one day in [todayIso, horizonIso] is bookable (not in `blockedDates`). */
export function hasOpenDayInHorizon(
  todayIso: string,
  horizonIso: string,
  blockedDates: Set<string>
): boolean {
  return computeNextOpenDay(todayIso, horizonIso, blockedDates) !== null;
}

export function isDayOpen(
  dateIso: string,
  todayIso: string,
  horizonIso: string,
  blocked: Set<string>
): boolean {
  if (dateIso < todayIso || dateIso > horizonIso) return false;
  return !blocked.has(dateIso);
}

export function isRangeEntirelyOpen(
  start: string,
  end: string,
  todayIso: string,
  horizonIso: string,
  blocked: Set<string>
): boolean {
  if (!start || !end || start > end) return false;
  if (start < todayIso) return false;
  const [sy, sm, sd] = start.split('-').map(Number);
  const cursor = new Date(sy, sm - 1, sd);
  const [ey, em, ed] = end.split('-').map(Number);
  const endDt = new Date(ey, em - 1, ed);

  while (cursor <= endDt) {
    const iso = toISODateLocal(cursor);
    if (!isDayOpen(iso, todayIso, horizonIso, blocked)) return false;
    cursor.setDate(cursor.getDate() + 1);
  }
  return true;
}
