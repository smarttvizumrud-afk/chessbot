import { supabase } from './supabase';

export type PaidPlanKey = 'credits_50' | 'credits_100' | 'unlimited_year';
export type PricingPlanKey = 'trial' | PaidPlanKey;

type CheckoutResponse = {
  url?: unknown;
  error?: unknown;
};

export async function startPolarCheckout(productKey: PaidPlanKey) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) {
    throw new Error('Войди в аккаунт ещё раз, потом нажми купить.');
  }

  const { data, error } = await supabase.functions.invoke('polar-checkout', {
    body: { plan: toCheckoutPlan(productKey) },
  });

  if (error) throw error;

  const response = data as CheckoutResponse | null;
  if (typeof response?.url !== 'string') {
    const message = typeof response?.error === 'string'
      ? response.error
      : 'Could not start checkout.';
    throw new Error(message);
  }

  window.location.assign(response.url);
}

function toCheckoutPlan(productKey: PaidPlanKey) {
  return productKey === 'unlimited_year' ? 'yearly' : productKey;
}
