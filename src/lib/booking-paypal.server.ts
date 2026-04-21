import type { SupabaseClient } from '@supabase/supabase-js';
import {
  BOOKING_HORIZON_DAYS,
  buildBlockedSet,
  horizonEndIso,
  isRangeEntirelyOpen,
  toISODateLocal,
  type AvailabilityRow,
} from '@/lib/availability';
import { createServiceRoleClient } from '@/lib/supabase/admin';

export function computeBookingDays(startDate: string, endDate: string): number {
  const s = new Date(startDate).getTime();
  const e = new Date(endDate).getTime();
  return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
}

export function totalUsd(dailyRateUsd: number, days: number): number {
  return Math.round(dailyRateUsd * days * 100) / 100;
}

export function formatPayPalAmount(usd: number): string {
  return usd.toFixed(2);
}

export function buildCustomId(
  carId: string,
  startDate: string,
  endDate: string,
  renterId: string
): string {
  return `${carId}|${startDate}|${endDate}|${renterId}`;
}

export function parseCustomId(
  customId: string | undefined
): { carId: string; startDate: string; endDate: string; renterId: string } | null {
  if (!customId) return null;
  const parts = customId.split('|');
  if (parts.length !== 4) return null;
  const [carId, startDate, endDate, renterId] = parts;
  if (!carId || !startDate || !endDate || !renterId) return null;
  return { carId, startDate, endDate, renterId };
}

export async function fetchAvailabilityInRange(
  supabase: SupabaseClient,
  carId: string,
  startDate: string,
  endDate: string
): Promise<AvailabilityRow[]> {
  const { data, error } = await supabase
    .from('car_availability')
    .select('available_date, is_available')
    .eq('car_id', carId)
    .gte('available_date', startDate)
    .lte('available_date', endDate);
  if (error) throw error;
  return (data ?? []) as AvailabilityRow[];
}

export function isRangeBookable(
  startDate: string,
  endDate: string,
  availabilityRows: AvailabilityRow[]
): boolean {
  const todayStr = toISODateLocal(new Date());
  const horizonEnd = horizonEndIso(todayStr, BOOKING_HORIZON_DAYS);
  const blocked = buildBlockedSet(availabilityRows);
  return isRangeEntirelyOpen(startDate, endDate, todayStr, horizonEnd, blocked);
}

export interface FinalizeBookingInput {
  orderId: string;
  captureId: string;
  amountValue: string;
  currencyCode: string;
  customId: string | undefined;
  /** Must match the authenticated user for capture route; webhook passes verified renter id from custom_id */
  expectedRenterId?: string;
}

export interface FinalizeBookingResult {
  ok: true;
  bookingId: string;
  duplicate?: boolean;
}

export interface FinalizeBookingError {
  ok: false;
  status: number;
  message: string;
}

export async function finalizePaidBooking(
  input: FinalizeBookingInput
): Promise<FinalizeBookingResult | FinalizeBookingError> {
  const parsed = parseCustomId(input.customId);
  if (!parsed) {
    return { ok: false, status: 400, message: 'Invalid order metadata.' };
  }
  const { carId, startDate, endDate, renterId } = parsed;

  if (input.expectedRenterId && input.expectedRenterId !== renterId) {
    return { ok: false, status: 403, message: 'Order does not belong to this user.' };
  }

  if (input.currencyCode !== 'USD') {
    return { ok: false, status: 400, message: 'Only USD is supported.' };
  }

  const days = computeBookingDays(startDate, endDate);
  if (days < 1) {
    return { ok: false, status: 400, message: 'Invalid date range.' };
  }

  const admin = createServiceRoleClient();

  const { data: car, error: carError } = await admin
    .from('cars')
    .select('id, daily_rate_usd, is_active')
    .eq('id', carId)
    .maybeSingle();

  if (carError || !car) {
    return { ok: false, status: 404, message: 'Car not found.' };
  }
  if (!car.is_active) {
    return { ok: false, status: 400, message: 'This listing is not available.' };
  }

  const daily = Number(car.daily_rate_usd);
  const expectedTotal = totalUsd(daily, days);
  const paid = Number.parseFloat(input.amountValue);
  if (!Number.isFinite(paid) || Math.abs(paid - expectedTotal) > 0.02) {
    return {
      ok: false,
      status: 400,
      message: 'Payment amount does not match the current price for these dates.',
    };
  }

  const availabilityRows = await fetchAvailabilityInRange(admin, carId, startDate, endDate);
  if (!isRangeBookable(startDate, endDate, availabilityRows)) {
    return { ok: false, status: 409, message: 'Those dates are no longer available.' };
  }

  const { data: existing } = await admin
    .from('bookings')
    .select('id')
    .eq('paypal_order_id', input.orderId)
    .maybeSingle();

  if (existing?.id) {
    return { ok: true, bookingId: existing.id, duplicate: true };
  }

  const { data: inserted, error: insertError } = await admin
    .from('bookings')
    .insert({
      car_id: carId,
      renter_id: renterId,
      start_date: startDate,
      end_date: endDate,
      status: 'pending',
      total_amount_usd: expectedTotal,
      paypal_order_id: input.orderId,
      paypal_capture_id: input.captureId,
      payment_currency: 'USD',
      payment_status: 'paid',
    })
    .select('id')
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
      const { data: row } = await admin
        .from('bookings')
        .select('id')
        .eq('paypal_order_id', input.orderId)
        .maybeSingle();
      if (row?.id) {
        return { ok: true, bookingId: row.id, duplicate: true };
      }
    }
    console.error('finalizePaidBooking insert error:', insertError);
    return { ok: false, status: 500, message: 'Could not save booking.' };
  }

  const blocks: { car_id: string; available_date: string; is_available: boolean }[] = [];
  for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
    blocks.push({
      car_id: carId,
      available_date: d.toISOString().slice(0, 10),
      is_available: false,
    });
  }

  const { error: availError } = await admin
    .from('car_availability')
    .upsert(blocks, { onConflict: 'car_id,available_date' });

  if (availError) {
    console.error('finalizePaidBooking availability error:', availError);
    return {
      ok: false,
      status: 500,
      message:
        'Payment was captured but the calendar could not be updated. Contact support with your PayPal receipt.',
    };
  }

  return { ok: true, bookingId: inserted.id };
}

/** Extract capture id, amount, currency, custom_id from PayPal capture response */
export function extractFromCaptureResponse(orderJson: unknown): {
  captureId: string;
  amountValue: string;
  currencyCode: string;
  customId: string | undefined;
} | null {
  const o = orderJson as {
    purchase_units?: Array<{
      custom_id?: string;
      payments?: {
        captures?: Array<{
          id?: string;
          amount?: { currency_code?: string; value?: string };
        }>;
      };
    }>;
  };
  const unit = o.purchase_units?.[0];
  if (!unit?.payments?.captures?.[0]) return null;
  const cap = unit.payments.captures[0];
  const id = cap.id;
  const value = cap.amount?.value;
  const cur = cap.amount?.currency_code;
  if (!id || !value || !cur) return null;
  return {
    captureId: id,
    amountValue: value,
    currencyCode: cur,
    customId: unit.custom_id,
  };
}
