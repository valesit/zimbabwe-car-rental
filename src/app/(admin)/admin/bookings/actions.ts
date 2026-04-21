'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { toISODateLocal } from '@/lib/availability';

async function requireAdminSupabase() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase: null, message: 'Not signed in' };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') return { supabase: null, message: 'Forbidden' };
  return { supabase, message: null };
}

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

export async function confirmBooking(bookingId: string) {
  const { supabase, message } = await requireAdminSupabase();
  if (!supabase) return { ok: false as const, message: message ?? 'Unauthorized' };

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'confirmed' })
    .eq('id', bookingId)
    .eq('status', 'pending');

  if (error) return { ok: false as const, message: error.message };

  revalidatePath('/admin');
  revalidatePath('/admin/bookings');
  return { ok: true as const };
}

export async function rejectBooking(bookingId: string) {
  const { supabase, message } = await requireAdminSupabase();
  if (!supabase) return { ok: false as const, message: message ?? 'Unauthorized' };

  const { data: row, error: fetchErr } = await supabase
    .from('bookings')
    .select('id, car_id, start_date, end_date, status')
    .eq('id', bookingId)
    .single();

  if (fetchErr || !row) return { ok: false as const, message: fetchErr?.message ?? 'Booking not found' };
  if (row.status !== 'pending') return { ok: false as const, message: 'Only pending bookings can be declined.' };

  const { error: upErr } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);
  if (upErr) return { ok: false as const, message: upErr.message };

  const days = datesBetweenInclusive(row.start_date, row.end_date);
  if (days.length > 0) {
    const upserts = days.map((available_date) => ({
      car_id: row.car_id,
      available_date,
      is_available: true,
    }));
    await supabase.from('car_availability').upsert(upserts, { onConflict: 'car_id,available_date' });
  }

  revalidatePath('/admin');
  revalidatePath('/admin/bookings');
  return { ok: true as const };
}
