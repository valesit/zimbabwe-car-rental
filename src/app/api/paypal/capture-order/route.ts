import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  extractFromCaptureResponse,
  finalizePaidBooking,
} from '@/lib/booking-paypal.server';
import {
  capturePayPalOrder,
  getPayPalAccessToken,
  getPayPalOrder,
} from '@/lib/paypal';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { orderID?: string };
    const orderID = body.orderID?.trim();
    if (!orderID) {
      return NextResponse.json({ error: 'orderID is required.' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const accessToken = await getPayPalAccessToken();
    let orderJson: unknown = await capturePayPalOrder(accessToken, orderID);
    let extracted = extractFromCaptureResponse(orderJson);
    if (extracted && !extracted.customId) {
      orderJson = await getPayPalOrder(accessToken, orderID);
      extracted = extractFromCaptureResponse(orderJson) ?? extracted;
    }
    if (!extracted) {
      return NextResponse.json(
        { error: 'Could not read payment details from PayPal.' },
        { status: 502 }
      );
    }

    const result = await finalizePaidBooking({
      orderId: orderID,
      captureId: extracted.captureId,
      amountValue: extracted.amountValue,
      currencyCode: extracted.currencyCode,
      customId: extracted.customId,
      expectedRenterId: user.id,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: result.status });
    }

    return NextResponse.json({
      bookingId: result.bookingId,
      duplicate: result.duplicate ?? false,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Capture failed.';
    console.error('capture-order:', e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
