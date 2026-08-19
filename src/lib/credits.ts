import { isGuestMode } from './guestSession';
import { supabase } from './supabase';

export type SubscriptionState = {
  status: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
};

export type BillingState = {
  balance: number;
  subscription?: SubscriptionState;
};

export class NotEnoughCreditsError extends Error {
  constructor() {
    super('Not enough credits.');
    this.name = 'NotEnoughCreditsError';
  }
}

type CreditBalanceRow = {
  balance: number;
};

type SubscriptionRow = {
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
};

export async function loadBillingState(): Promise<BillingState> {
  if (isGuestMode()) return { balance: 0 };

  const [balanceResult, subscriptionResult] = await Promise.all([
    supabase.from('credit_balances').select('balance').maybeSingle(),
    supabase
      .from('user_subscriptions')
      .select('status, current_period_end, cancel_at_period_end')
      .maybeSingle(),
  ]);

  if (balanceResult.error) throw balanceResult.error;
  if (subscriptionResult.error) throw subscriptionResult.error;

  return {
    balance: balanceResult.data ? mapCreditBalance(balanceResult.data as CreditBalanceRow).balance : 0,
    subscription: subscriptionResult.data
      ? mapSubscription(subscriptionResult.data as SubscriptionRow)
      : undefined,
  };
}

export function hasActiveSubscription(state: BillingState) {
  const subscription = state.subscription;
  if (!subscription) return false;
  if (subscription.status !== 'active' && subscription.status !== 'trialing') return false;
  if (!subscription.currentPeriodEnd) return true;
  return new Date(subscription.currentPeriodEnd) > new Date();
}

export async function spendCredits(amount: number, productKey: string, metadata: Record<string, unknown> = {}) {
  const state = await loadBillingState();
  if (amount <= 0 || hasActiveSubscription(state)) return;
  const { data, error } = await supabase.rpc('spend_user_credits', {
    p_amount: amount,
    p_product_key: productKey,
    p_metadata: metadata,
  });
  if (error) throw error;
  if (data !== true) throw new NotEnoughCreditsError();
}

function mapCreditBalance(row: CreditBalanceRow) {
  return { balance: row.balance };
}

function mapSubscription(row: SubscriptionRow): SubscriptionState {
  return {
    status: row.status,
    currentPeriodEnd: row.current_period_end ?? undefined,
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
  };
}
