import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  buildCustomId,
  fetchAvailabilityInRange,
  formatPayPalAmount,
  isRangeBookable,
  totalUsd,
  computeBookingDays,
} from '@/lib/booking-paypal.server';
import { createPayPalOrder, getPayPalAccessToken } from '@/lib/paypal';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      carId?: string;
      startDate?: string;
      endDate?: string;
    };
    const carId = body.carId?.trim();
    const startDate = body.startDate?.trim();
    const endDate = body.endDate?.trim();
    if (!carId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'carId, startDate, and endDate are required.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { data: car, error: carError } = await supabase
      .from('cars')
      .select('id, daily_rate_usd, is_active')
      .eq('id', carId)
      .maybeSingle();

    if (carError || !car) {
      return NextResponse.json({ error: 'Car not found.' }, { status: 404 });
    }
    if (!car.is_active) {
      return NextResponse.json({ error: 'This listing is not available.' }, { status: 400 });
    }

    const days = computeBookingDays(startDate, endDate);
    if (days < 1) {
      return NextResponse.json({ error: 'Invalid date range.' }, { status: 400 });
    }

    const availabilityRows = await fetchAvailabilityInRange(supabase, carId, startDate, endDate);
    if (!isRangeBookable(startDate, endDate, availabilityRows)) {
      return NextResponse.json(
        { error: 'Selected dates are not fully available.' },
        { status: 409 }
      );
    }

    const daily = Number(car.daily_rate_usd);
    const total = totalUsd(daily, days);
    const amountUsd = formatPayPalAmount(total);
    const customId = buildCustomId(carId, startDate, endDate, user.id);

    const accessToken = await getPayPalAccessToken();
    const { id: orderID } = await createPayPalOrder({
      accessToken,
      amountUsd,
      customId,
    });

    return NextResponse.json({ orderID });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to create order.';
    console.error('create-order:', e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
