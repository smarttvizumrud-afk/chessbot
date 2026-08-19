import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.110.8';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

type RedeemResult = {
  ok?: unknown;
  credits?: unknown;
  reason?: unknown;
};

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return json({ error: 'Promo codes are not configured yet.' }, 503);
    }

    const body = (await req.json()) as { code?: unknown };
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    if (code.length < 3 || code.length > 40) return json({ error: 'Enter a valid promo code.' }, 400);

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data, error: userError } = await authClient.auth.getUser();
    if (userError || !data.user) return json({ error: 'Sign in before using a promo code.' }, 401);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: result, error } = await admin.rpc('redeem_promo_code', {
      p_user_id: data.user.id,
      p_code: code,
    });
    if (error) throw error;

    return redeemResponse(result as RedeemResult | null);
  } catch (error) {
    console.error('Promo code redeem failed', error);
    return json({ error: 'Could not apply promo code.' }, 500);
  }
});

function redeemResponse(result: RedeemResult | null) {
  if (result?.ok === true) {
    return json({ credits: Number(result.credits) || 0 });
  }

  return json({ error: messageForReason(result?.reason) }, 400);
}

function messageForReason(reason: unknown) {
  if (reason === 'already_used') return 'This promo code was already used.';
  if (reason === 'expired') return 'This promo code has expired.';
  if (reason === 'limit_reached') return 'This promo code has no activations left.';
  if (reason === 'not_started') return 'This promo code is not active yet.';
  return 'Promo code was not found.';
}
