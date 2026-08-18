import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { AuthGate } from '../components/AuthGate';
import { PricingCard } from '../components/PricingCard';
import { hasUnlimitedAccess, loadCreditBalance, type CreditBalance } from '../lib/credits';
import { startPolarCheckout, type PaidPlanKey, type PricingPlanKey } from '../lib/payments';
import type { Lang } from '../lib/types';

type Plan = {
  productKey: PricingPlanKey;
  title: string;
  price: string;
  caption?: string;
  icon: string;
  action: string;
  highlighted?: boolean;
};

const plans: Plan[] = [
  { productKey: 'trial', title: 'Free trial', price: '$0', icon: '♙', action: 'Included' },
  { productKey: 'credits_50', title: '50 credits', price: '$5', icon: '⚡', action: 'Buy now' },
  { productKey: 'credits_100', title: '100 credits', price: '$10', icon: '♕', action: 'Buy now', highlighted: true },
  { productKey: 'unlimited_year', title: '1 year unlimited', price: '$35', caption: 'from', icon: '∞', action: 'Subscribe' },
];

const text: Record<Lang, { title: string; kicker: string; secure: string; wait: string; ready: string }> = {
  ru: {
    title: 'Credits',
    kicker: 'Buy extra AI analysis credits after sign in.',
    secure: 'Secure payment. Credits appear after the Polar webhook is verified.',
    wait: 'Opening Polar checkout...',
    ready: 'Payment received. Balance updates when Polar sends the verified webhook.',
  },
  en: {
    title: 'Credits',
    kicker: 'Buy extra AI analysis credits after sign in.',
    secure: 'Secure payment. Credits appear after the Polar webhook is verified.',
    wait: 'Opening Polar checkout...',
    ready: 'Payment received. Balance updates when Polar sends the verified webhook.',
  },
  kk: {
    title: 'Credits',
    kicker: 'Buy extra AI analysis credits after sign in.',
    secure: 'Secure payment. Credits appear after the Polar webhook is verified.',
    wait: 'Opening Polar checkout...',
    ready: 'Payment received. Balance updates when Polar sends the verified webhook.',
  },
};

export function PricingPage({ lang, onLangChange }: { lang: Lang; onLangChange?: (lang: Lang) => void }) {
  return (
    <AuthGate lang={lang} onLangChange={onLangChange}>
      <PricingContent lang={lang} />
    </AuthGate>
  );
}

function PricingContent({ lang }: { lang: Lang }) {
  const [balance, setBalance] = useState<CreditBalance>({ balance: 0 });
  const [busyPlan, setBusyPlan] = useState<PaidPlanKey | null>(null);
  const [message, setMessage] = useState('');
  const copy = text[lang];

  useEffect(() => {
    loadCreditBalance().then(setBalance).catch(() => setMessage('Could not load credits.'));
  }, []);

  async function buy(productKey: PaidPlanKey) {
    setBusyPlan(productKey);
    setMessage(copy.wait);
    try {
      await startPolarCheckout(productKey);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not open checkout.');
      setBusyPlan(null);
    }
  }

  return (
    <div className="pricing-page">
      <section className="pricing-header">
        <div>
          <p>{copy.kicker}</p>
          <h1>{copy.title}</h1>
        </div>
        <div className="credit-status">
          <span>Balance</span>
          <strong>{hasUnlimitedAccess(balance) ? 'Unlimited' : balance.balance}</strong>
        </div>
      </section>
      {new URLSearchParams(window.location.search).has('checkout_id') && (
        <section className="panel success-note">{copy.ready}</section>
      )}
      {message && <section className="panel message">{message}</section>}
      <section className="pricing-grid">
        {plans.map((plan) => (
          <PricingCard
            key={plan.productKey}
            {...plan}
            busy={busyPlan === plan.productKey}
            onBuy={buy}
          />
        ))}
      </section>
      <footer className="pricing-footer">
        <span aria-hidden="true">🔒</span>
        <p>{copy.secure}</p>
        <Link href="/auth" className="account-link secondary">Account</Link>
      </footer>
    </div>
  );
}
