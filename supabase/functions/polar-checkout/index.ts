import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.110.8';

const POLAR_ACCESS_TOKEN = Deno.env.get('POLAR_ACCESS_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SITE_URL = Deno.env.get('SITE_URL') ?? 'http://localhost:5173';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ProductKey = 'credits_50' | 'credits_100' | 'unlimited_year';

const products: Record<ProductKey, { env: string; credits: number; unlimitedDays?: number }> = {
  credits_50: { env: 'POLAR_PRODUCT_50_CREDITS', credits: 50 },
  credits_100: { env: 'POLAR_PRODUCT_100_CREDITS', credits: 100 },
  unlimited_year: { env: 'POLAR_PRODUCT_YEAR_UNLIMITED', credits: 0, unlimitedDays: 365 },
};

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Use a POST request.' }, 405);

  try {
    if (!POLAR_ACCESS_TOKEN || !SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return json({ error: 'Payments are not configured yet.' }, 503);
    }

    const body = (await req.json()) as { productKey?: unknown };
    const productKey = body.productKey;
    if (!isProductKey(productKey)) return json({ error: 'Unknown product.' }, 400);

    const product = products[productKey];
    const productId = Deno.env.get(product.env);
    if (!productId) return json({ error: 'This product is not configured yet.' }, 503);

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data, error: userError } = await authClient.auth.getUser();
    if (userError || !data.user) return json({ error: 'Sign in before buying credits.' }, 401);

    const origin = req.headers.get('origin') ?? SITE_URL;
    const checkout = await createPolarCheckout({
      productId,
      productKey,
      userId: data.user.id,
      email: data.user.email ?? undefined,
      credits: product.credits,
      unlimitedDays: product.unlimitedDays,
      origin,
    });

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { error: storeError } = await admin.from('polar_checkout_sessions').insert({
      user_id: data.user.id,
      product_key: productKey,
      polar_checkout_id: checkout.id,
      status: checkout.status,
    });
    if (storeError) {
      console.error('Could not store Polar checkout', storeError);
      return json({ error: 'Checkout was created, but could not be recorded.' }, 500);
    }

    return json({ url: checkout.url });
  } catch (error) {
    console.error('Polar checkout failed', error);
    return json({ error: 'Could not start checkout.' }, 500);
  }
});

async function createPolarCheckout(input: {
  productId: string;
  productKey: ProductKey;
  userId: string;
  email?: string;
  credits: number;
  unlimitedDays?: number;
  origin: string;
}) {
  const response = await fetch('https://api.polar.sh/v1/checkouts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${POLAR_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      products: [input.productId],
      customer_email: input.email,
      external_customer_id: input.userId,
      success_url: `${input.origin}/pricing?checkout=success&checkout_id={CHECKOUT_ID}`,
      return_url: `${input.origin}/pricing`,
      metadata: {
        user_id: input.userId,
        product_key: input.productKey,
        credits: input.credits,
        unlimited_days: input.unlimitedDays ?? 0,
      },
    }),
  });

  const data = await response.json() as { id?: unknown; status?: unknown; url?: unknown };
  if (!response.ok || typeof data.id !== 'string' || typeof data.url !== 'string') {
    console.error('Polar API rejected checkout', response.status, data);
    throw new Error('Polar checkout failed.');
  }

  return {
    id: data.id,
    status: typeof data.status === 'string' ? data.status : 'open',
    url: data.url,
  };
}

function isProductKey(value: unknown): value is ProductKey {
  return value === 'credits_50' || value === 'credits_100' || value === 'unlimited_year';
}
