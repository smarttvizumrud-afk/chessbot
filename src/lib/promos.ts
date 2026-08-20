import { supabase } from './supabase';

type PromoResponse = {
  credits?: unknown;
  subscription?: unknown;
  subscriptionDays?: unknown;
  error?: unknown;
};

export type PromoRedeemResult = {
  credits: number;
  subscription: boolean;
  subscriptionDays: number;
};

export async function redeemPromoCode(code: string) {
  const { data, error } = await supabase.functions.invoke('redeem-promo', {
    body: { code },
  });

  if (error) throw error;

  const response = data as PromoResponse | null;
  if (typeof response?.credits === 'number') {
    return {
      credits: response.credits,
      subscription: response.subscription === true,
      subscriptionDays: typeof response.subscriptionDays === 'number' ? response.subscriptionDays : 0,
    };
  }

  const message = typeof response?.error === 'string'
    ? response.error
    : 'Could not apply promo code.';
  throw new Error(message);
}
