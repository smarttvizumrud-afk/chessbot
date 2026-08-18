import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.110.8';
import { Webhook } from 'npm:standardwebhooks';

const POLAR_WEBHOOK_SECRET = Deno.env.get('POLAR_WEBHOOK_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

type ProductKey = 'credits_50' | 'credits_100' | 'unlimited_year';

type PolarPayload = {
  type?: unknown;
  data?: {
    id?: unknown;
    checkout_id?: unknown;
    status?: unknown;
    metadata?: Record<string, unknown>;
    customer?: { external_id?: unknown };
  };
};

const productCredits: Record<ProductKey, number> = {
  credits_50: 50,
  credits_100: 100,
  unlimited_year: 0,
};

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Use a POST request.' }, 405);

  try {
    if (!POLAR_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return json({ error: 'Webhook is not configured.' }, 503);
    }

    const rawBody = await req.text();
    const payload = verifyPolarPayload(rawBody, req.headers);
    const eventId = req.headers.get('webhook-id') ?? '';

    if (payload.type !== 'order.paid') {
      await updateCheckoutStatus(payload);
      return json({ received: true, ignored: true }, 202);
    }

    const metadata = payload.data?.metadata ?? {};
    const userId = readString(metadata.user_id) ?? readString(payload.data?.customer?.external_id);
    const productKey = readProductKey(metadata.product_key);
    const orderId = readString(payload.data?.id);

    if (!userId || !productKey || !orderId || !eventId) {
      console.error('Polar order missing grant metadata', payload);
      return json({ error: 'Missing order metadata.' }, 400);
    }

    const applied = await applyCreditGrant({
      userId,
      productKey,
      credits: productCredits[productKey],
      unlimitedUntil: productKey === 'unlimited_year' ? oneYearFromNow() : null,
      eventId,
      orderId,
      metadata,
    });

    await updateCheckoutStatus(payload, 'paid');
    return json({ received: true, applied }, 202);
  } catch (error) {
    console.error('Polar webhook failed', error);
    return json({ error: 'Webhook rejected.' }, 403);
  }
});

function verifyPolarPayload(rawBody: string, headers: Headers): PolarPayload {
  const secret = btoa(POLAR_WEBHOOK_SECRET ?? '');
  const webhook = new Webhook(secret);
  const verified = webhook.verify(rawBody, {
    'webhook-id': headers.get('webhook-id') ?? '',
    'webhook-signature': headers.get('webhook-signature') ?? '',
    'webhook-timestamp': headers.get('webhook-timestamp') ?? '',
  });
  return verified as PolarPayload;
}

async function applyCreditGrant(input: {
  userId: string;
  productKey: ProductKey;
  credits: number;
  unlimitedUntil: string | null;
  eventId: string;
  orderId: string;
  metadata: Record<string, unknown>;
}) {
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await admin.rpc('apply_polar_credit_grant', {
    p_user_id: input.userId,
    p_product_key: input.productKey,
    p_delta: input.credits,
    p_unlimited_until: input.unlimitedUntil,
    p_polar_event_id: input.eventId,
    p_polar_order_id: input.orderId,
    p_metadata: input.metadata,
  });

  if (error) throw error;
  return Boolean(data);
}

async function updateCheckoutStatus(payload: PolarPayload, fallbackStatus?: string) {
  const checkoutId = readString(payload.data?.checkout_id);
  if (!checkoutId) return;

  const status = readString(payload.data?.status) ?? fallbackStatus ?? readString(payload.type) ?? 'updated';
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  await admin
    .from('polar_checkout_sessions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('polar_checkout_id', checkoutId);
}

function readProductKey(value: unknown): ProductKey | null {
  return value === 'credits_50' || value === 'credits_100' || value === 'unlimited_year' ? value : null;
}

function readString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null;
}

function oneYearFromNow() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString();
}
