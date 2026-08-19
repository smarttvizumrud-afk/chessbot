import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.110.8';
import { Webhook } from 'npm:standardwebhooks';

const POLAR_WEBHOOK_SECRET = Deno.env.get('POLAR_WEBHOOK_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

type PlanKey = 'credits_50' | 'credits_100' | 'yearly';

type PolarRecord = {
  id?: unknown;
  checkout_id?: unknown;
  subscription_id?: unknown;
  customer_id?: unknown;
  product_id?: unknown;
  status?: unknown;
  cancel_at_period_end?: unknown;
  current_period_start?: unknown;
  current_period_start_at?: unknown;
  current_period_end?: unknown;
  current_period_end_at?: unknown;
  metadata?: Record<string, unknown>;
  customer?: {
    id?: unknown;
    external_id?: unknown;
  };
  product?: {
    id?: unknown;
  };
};

type PolarPayload = {
  type?: unknown;
  data?: PolarRecord;
};

const creditPlans: Record<Extract<PlanKey, 'credits_50' | 'credits_100'>, number> = {
  credits_50: 50,
  credits_100: 100,
};

const subscriptionEvents = new Set([
  'subscription.created',
  'subscription.active',
  'subscription.updated',
  'subscription.canceled',
  'subscription.revoked',
  'subscription.past_due',
  'subscription.paused',
  'subscription.resumed',
  'subscription.cycled',
  'subscription.uncanceled',
  'subscription.expired',
]);

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
    const eventType = readString(payload.type);
    if (!eventId || !eventType) return json({ error: 'Missing event id or type.' }, 400);

    if (eventType === 'order.paid') {
      const applied = await handlePaidOrder(eventId, eventType, payload);
      await updateCheckoutStatus(payload, 'paid');
      return json({ received: true, applied }, 202);
    }

    if (subscriptionEvents.has(eventType)) {
      const applied = await handleSubscriptionEvent(eventId, eventType, payload);
      await updateCheckoutStatus(payload);
      return json({ received: true, applied }, 202);
    }

    if (eventType === 'checkout.expired') {
      const recorded = await recordWebhookEvent(eventId, eventType, payload);
      await updateCheckoutStatus(payload, 'expired');
      return json({ received: true, recorded }, 202);
    }

    const recorded = await recordWebhookEvent(eventId, eventType, payload);
    return json({ received: true, ignored: true, recorded }, 202);
  } catch (error) {
    console.error('Polar webhook failed', error);
    return json({ error: 'Webhook rejected.' }, 403);
  }
});

function verifyPolarPayload(rawBody: string, headers: Headers): PolarPayload {
  const webhook = new Webhook(btoa(POLAR_WEBHOOK_SECRET ?? ''));
  const verified = webhook.verify(rawBody, {
    'webhook-id': headers.get('webhook-id') ?? '',
    'webhook-signature': headers.get('webhook-signature') ?? '',
    'webhook-timestamp': headers.get('webhook-timestamp') ?? '',
  });
  return verified as PolarPayload;
}

async function handlePaidOrder(eventId: string, eventType: string, payload: PolarPayload) {
  const metadata = payload.data?.metadata ?? {};
  const plan = planFromPayload(payload);
  const userId = userIdFromPayload(payload);
  const orderId = readString(payload.data?.id);

  if (plan === 'yearly') return recordWebhookEvent(eventId, eventType, payload);
  if (plan !== 'credits_50' && plan !== 'credits_100') {
    console.error('Polar order has unknown plan', payload);
    return recordWebhookEvent(eventId, eventType, payload);
  }
  if (!userId || !orderId) {
    console.error('Polar order missing credit grant metadata', payload);
    throw new Error('Missing order metadata.');
  }

  const admin = adminClient();
  const { data, error } = await admin.rpc('apply_polar_credit_purchase', {
    p_event_id: eventId,
    p_event_type: eventType,
    p_user_id: userId,
    p_product_key: plan,
    p_delta: creditPlans[plan],
    p_polar_order_id: orderId,
    p_payload: payload,
    p_metadata: metadata,
  });

  if (error) throw error;
  return Boolean(data);
}

async function handleSubscriptionEvent(eventId: string, eventType: string, payload: PolarPayload) {
  const userId = userIdFromPayload(payload);
  if (!userId) {
    console.error('Polar subscription missing user metadata', payload);
    throw new Error('Missing subscription user metadata.');
  }

  const data = payload.data ?? {};
  const admin = adminClient();
  const { data: applied, error } = await admin.rpc('apply_polar_subscription_event', {
    p_event_id: eventId,
    p_event_type: eventType,
    p_user_id: userId,
    p_product_key: 'yearly',
    p_polar_subscription_id: readString(data.id) ?? readString(data.subscription_id),
    p_polar_customer_id: readString(data.customer_id) ?? readString(data.customer?.id),
    p_status: subscriptionStatus(eventType, data.status),
    p_cancel_at_period_end: data.cancel_at_period_end === true,
    p_current_period_start: readDate(data.current_period_start) ?? readDate(data.current_period_start_at),
    p_current_period_end: readDate(data.current_period_end) ?? readDate(data.current_period_end_at),
    p_payload: payload,
  });

  if (error) throw error;
  return Boolean(applied);
}

async function recordWebhookEvent(eventId: string, eventType: string, payload: PolarPayload) {
  const admin = adminClient();
  const { data, error } = await admin.rpc('record_polar_webhook_event', {
    p_event_id: eventId,
    p_event_type: eventType,
    p_payload: payload,
  });

  if (error) throw error;
  return Boolean(data);
}

async function updateCheckoutStatus(payload: PolarPayload, fallbackStatus?: string) {
  const checkoutId = readString(payload.data?.checkout_id);
  if (!checkoutId) return;

  const data = payload.data ?? {};
  const status = readString(data.status) ?? fallbackStatus ?? readString(payload.type) ?? 'updated';
  await adminClient()
    .from('polar_checkout_sessions')
    .update({
      status,
      polar_customer_id: readString(data.customer_id) ?? readString(data.customer?.id),
      polar_subscription_id: readString(data.subscription_id),
      updated_at: new Date().toISOString(),
    })
    .eq('polar_checkout_id', checkoutId);
}

function subscriptionStatus(eventType: string, value: unknown) {
  if (eventType === 'subscription.created') return 'created';
  if (eventType === 'subscription.revoked') return 'revoked';
  if (eventType === 'subscription.expired') return 'expired';
  if (eventType === 'subscription.paused') return 'paused';
  return readString(value) ?? eventType.replace('subscription.', '');
}

function planFromPayload(payload: PolarPayload): PlanKey | null {
  const metadata = payload.data?.metadata ?? {};
  const metadataPlan = normalizePlan(metadata.plan ?? metadata.product_key);
  if (metadataPlan) return metadataPlan;

  const productId = readString(payload.data?.product_id) ?? readString(payload.data?.product?.id);
  if (!productId) return null;

  if (productId === Deno.env.get('POLAR_PRODUCT_CREDITS_50_ID')) return 'credits_50';
  if (productId === Deno.env.get('POLAR_PRODUCT_CREDITS_100_ID')) return 'credits_100';
  if (productId === Deno.env.get('POLAR_PRODUCT_YEARLY_ID')) return 'yearly';
  return null;
}

function userIdFromPayload(payload: PolarPayload) {
  const metadata = payload.data?.metadata ?? {};
  return readString(metadata.user_id) ?? readString(payload.data?.customer?.external_id);
}

function normalizePlan(value: unknown): PlanKey | null {
  if (value === 'credits_50' || value === 'credits_100' || value === 'yearly') return value;
  if (value === 'unlimited_year') return 'yearly';
  return null;
}

function readString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null;
}

function readDate(value: unknown) {
  const text = readString(value);
  return text ? text : null;
}

function adminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}
