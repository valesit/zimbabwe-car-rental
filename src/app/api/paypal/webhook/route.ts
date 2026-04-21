import { NextResponse } from 'next/server';
import {
  extractFromCaptureResponse,
  finalizePaidBooking,
} from '@/lib/booking-paypal.server';
import {
  getPayPalAccessToken,
  getPayPalOrder,
  verifyWebhookSignature,
} from '@/lib/paypal';

export const dynamic = 'force-dynamic';

type CaptureCompletedResource = {
  id?: string;
  amount?: { currency_code?: string; value?: string };
  supplementary_data?: {
    related_ids?: { order_id?: string };
  };
};

type WebhookPayload = {
  event_type?: string;
  resource?: CaptureCompletedResource;
};

export async function POST(request: Request) {
  const rawBody = await request.text();
  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const transmissionId = request.headers.get('paypal-transmission-id') ?? '';
  const transmissionTime = request.headers.get('paypal-transmission-time') ?? '';
  const certUrl = request.headers.get('paypal-cert-url') ?? '';
  const authAlgo = request.headers.get('paypal-auth-algo') ?? '';
  const transmissionSig = request.headers.get('paypal-transmission-sig') ?? '';
  const webhookId = process.env.PAYPAL_WEBHOOK_ID?.trim();

  try {
    if (webhookId && transmissionId && transmissionSig) {
      const accessToken = await getPayPalAccessToken();
      const ok = await verifyWebhookSignature({
        accessToken,
        webhookId,
        transmissionId,
        transmissionTime,
        certUrl,
        authAlgo,
        transmissionSig,
        body: JSON.parse(rawBody) as unknown,
      });
      if (!ok) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else if (!webhookId) {
      console.warn(
        'PayPal webhook: PAYPAL_WEBHOOK_ID not set; signature verification skipped.'
      );
    }

    if (payload.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
      return NextResponse.json({ received: true });
    }

    const resource = payload.resource;
    const orderId = resource?.supplementary_data?.related_ids?.order_id;
    const captureId = resource?.id;
    const amountValue = resource?.amount?.value;
    const currencyCode = resource?.amount?.currency_code;

    if (!orderId || !captureId || !amountValue || !currencyCode) {
      return NextResponse.json({ received: true, note: 'missing capture fields' });
    }

    const accessToken = await getPayPalAccessToken();
    const orderJson = await getPayPalOrder(accessToken, orderId);
    const extracted = extractFromCaptureResponse(orderJson);
    if (!extracted) {
      console.error('webhook: could not parse order after capture', orderId);
      return NextResponse.json({ received: true, note: 'order parse failed' });
    }

    const result = await finalizePaidBooking({
      orderId,
      captureId: extracted.captureId,
      amountValue: extracted.amountValue,
      currencyCode: extracted.currencyCode,
      customId: extracted.customId,
    });

    if (!result.ok) {
      console.error('webhook finalize:', result.message);
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error('PayPal webhook error:', e);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
