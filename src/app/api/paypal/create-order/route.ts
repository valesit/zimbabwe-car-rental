import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  buildCustomId,
  computeBookingTotalUsd,
  fetchAvailabilityInRange,
  formatPayPalAmount,
  isRangeBookable,
  roundMoney2,
  computeBookingDays,
} from '@/lib/booking-paypal.server';
import { createPayPalOrder, getPayPalAccessToken } from '@/lib/paypal';
import { allowPayPalCreateOrder } from '@/lib/paypal-rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      carId?: string;
      startDate?: string;
      endDate?: string;
      includePickupDropoff?: boolean;
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

    if (!allowPayPalCreateOrder(user.id)) {
      return NextResponse.json(
        { error: 'Too many checkout attempts. Try again in a few minutes.' },
        { status: 429 }
      );
    }

    const includePickupDropoff = Boolean(body.includePickupDropoff);

    const { data: car, error: carError } = await supabase
      .from('cars')
      .select('id, daily_rate_usd, is_active, refundable_deposit_usd')
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
    const depositSnapshot = roundMoney2(Math.max(0, Number(car.refundable_deposit_usd ?? 0)));
    const depositStr = formatPayPalAmount(depositSnapshot);
    const total = computeBookingTotalUsd(daily, days, includePickupDropoff, depositSnapshot);
    const amountUsd = formatPayPalAmount(total);
    const customId = buildCustomId(
      carId,
      startDate,
      endDate,
      user.id,
      includePickupDropoff,
      depositStr
    );

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
