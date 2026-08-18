import { isGuestMode } from './guestSession';
import { supabase } from './supabase';

export type CreditBalance = {
  balance: number;
  unlimitedUntil?: string;
};

type CreditBalanceRow = {
  balance: number;
  unlimited_until: string | null;
};

export async function loadCreditBalance(): Promise<CreditBalance> {
  if (isGuestMode()) return { balance: 0 };

  const { data, error } = await supabase
    .from('credit_balances')
    .select('balance, unlimited_until')
    .maybeSingle();

  if (error) throw error;
  if (!data) return { balance: 0 };

  return mapCreditBalance(data as CreditBalanceRow);
}

export function hasUnlimitedAccess(balance: CreditBalance) {
  return Boolean(balance.unlimitedUntil && new Date(balance.unlimitedUntil) > new Date());
}

function mapCreditBalance(row: CreditBalanceRow): CreditBalance {
  return {
    balance: row.balance,
    unlimitedUntil: row.unlimited_until ?? undefined,
  };
}
