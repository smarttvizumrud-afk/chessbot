import { supabase } from './supabase';

type PromoResponse = {
  credits?: unknown;
  error?: unknown;
};

export async function redeemPromoCode(code: string) {
  const { data, error } = await supabase.functions.invoke('redeem-promo', {
    body: { code },
  });

  if (error) throw error;

  const response = data as PromoResponse | null;
  if (typeof response?.credits === 'number') return response.credits;

  const message = typeof response?.error === 'string'
    ? response.error
    : 'Could not apply promo code.';
  throw new Error(message);
}
