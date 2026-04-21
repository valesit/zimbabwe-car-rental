function getApiBase(): string {
  const raw =
    process.env.PAYPAL_API_BASE?.trim() ||
    'https://api-m.sandbox.paypal.com';
  return raw.replace(/\/$/, '');
}

function getClientId(): string {
  return (
    process.env.PAYPAL_CLIENT_ID?.trim() ||
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim() ||
    ''
  );
}

export async function getPayPalAccessToken(): Promise<string> {
  const id = getClientId();
  const secret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  if (!id || !secret) {
    throw new Error('PayPal credentials are not configured');
  }
  const auth = Buffer.from(`${id}:${secret}`).toString('base64');
  const res = await fetch(`${getApiBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`PayPal token error: ${res.status} ${text}`);
  }
  const data = JSON.parse(text) as { access_token: string };
  return data.access_token;
}

export async function createPayPalOrder(params: {
  accessToken: string;
  amountUsd: string;
  customId: string;
}): Promise<{ id: string }> {
  const res = await fetch(`${getApiBase()}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: params.amountUsd,
          },
          custom_id: params.customId,
        },
      ],
      application_context: {
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
      },
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`PayPal create order error: ${res.status} ${text}`);
  }
  const data = JSON.parse(text) as { id: string };
  return { id: data.id };
}

export async function capturePayPalOrder(
  accessToken: string,
  orderId: string
): Promise<unknown> {
  const res = await fetch(
    `${getApiBase()}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
    }
  );
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`PayPal capture error: ${res.status} ${text}`);
  }
  return JSON.parse(text) as unknown;
}

export async function getPayPalOrder(
  accessToken: string,
  orderId: string
): Promise<unknown> {
  const res = await fetch(
    `${getApiBase()}/v2/checkout/orders/${encodeURIComponent(orderId)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`PayPal get order error: ${res.status} ${text}`);
  }
  return JSON.parse(text) as unknown;
}

export async function verifyWebhookSignature(params: {
  accessToken: string;
  webhookId: string;
  transmissionId: string;
  transmissionTime: string;
  certUrl: string;
  authAlgo: string;
  transmissionSig: string;
  body: unknown;
}): Promise<boolean> {
  const res = await fetch(`${getApiBase()}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transmission_id: params.transmissionId,
      transmission_time: params.transmissionTime,
      cert_url: params.certUrl,
      auth_algo: params.authAlgo,
      transmission_sig: params.transmissionSig,
      webhook_id: params.webhookId,
      webhook_event: params.body,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error('PayPal webhook verify HTTP error:', res.status, text);
    return false;
  }
  const data = JSON.parse(text) as { verification_status?: string };
  return data.verification_status === 'SUCCESS';
}
