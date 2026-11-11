import { horizonEndIso } from '@/lib/availability';

/** Validates the dates before searching and when decoding search query parameters. */
export function validateRentalSearchDates(
  start: string,
  end: string,
  today: string,
): string | null {
  if (!start && !end) return null;
  if (!start || !end) return 'Select both a pick-up and return date to search.';
  if (!isCalendarDate(start) || !isCalendarDate(end)) {
    return 'Enter valid pick-up and return dates.';
  }
  if (start < today) return 'Choose a pick-up date from today onward.';
  if (end < start) return 'The return date cannot be before the pick-up date.';
  if (end > horizonEndIso(today)) {
    return 'Choose dates within the next 400 days.';
  }
  return null;
}

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}
