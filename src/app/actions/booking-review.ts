'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { toISODateLocal } from '@/lib/availability';

function datesBetweenInclusive(startIso: string, endIso: string): string[] {
  const [sy, sm, sd] = startIso.split('-').map(Number);
  const d = new Date(sy, sm - 1, sd);
  const [ey, em, ed] = endIso.split('-').map(Number);
  const end = new Date(ey, em - 1, ed);
  const out: string[] = [];
  while (d <= end) {
    out.push(toISODateLocal(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

async function assertCanManagePendingBooking(bookingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, booking: null, allowed: false, message: 'Not signed in' };

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(
      `
      id,
      status,
      car_id,
      start_date,
      end_date,
      cars ( owner_id )
    `,
    )
    .eq('id', bookingId)
    .single();

  if (error || !booking) return { supabase, user, booking: null, allowed: false, message: 'Booking not found' };
  if (booking.status !== 'pending') {
    return { supabase, user, booking, allowed: false, message: 'Only pending bookings can be updated.' };
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role === 'admin') {
    return { supabase, user, booking, allowed: true, message: null };
  }

  const carRaw = booking.cars;
  const car = (Array.isArray(carRaw) ? carRaw[0] : carRaw) as { owner_id?: string } | null;
  if (car?.owner_id === user.id) {
    return { supabase, user, booking, allowed: true, message: null };
  }

  return { supabase, user, booking, allowed: false, message: 'You cannot manage this booking.' };
}

function revalidateBookingPaths() {
  revalidatePath('/admin');
  revalidatePath('/admin/bookings');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/bookings');
}

export async function confirmBooking(bookingId: string) {
  const { supabase, allowed, message } = await assertCanManagePendingBooking(bookingId);
  if (!allowed || !supabase) return { ok: false as const, message: message ?? 'Unauthorized' };

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'confirmed' })
    .eq('id', bookingId)
    .eq('status', 'pending');

  if (error) return { ok: false as const, message: error.message };

  revalidateBookingPaths();
  return { ok: true as const };
}

export async function rejectBooking(bookingId: string) {
  const { supabase, allowed, message, booking } = await assertCanManagePendingBooking(bookingId);
  if (!allowed || !supabase || !booking) return { ok: false as const, message: message ?? 'Unauthorized' };

  const { error: upErr } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);
  if (upErr) return { ok: false as const, message: upErr.message };

  const days = datesBetweenInclusive(booking.start_date, booking.end_date);
  if (days.length > 0) {
    const upserts = days.map((available_date) => ({
      car_id: booking.car_id,
      available_date,
      is_available: true,
    }));
    await supabase.from('car_availability').upsert(upserts, { onConflict: 'car_id,available_date' });
  }

  revalidateBookingPaths();
  return { ok: true as const };
}
