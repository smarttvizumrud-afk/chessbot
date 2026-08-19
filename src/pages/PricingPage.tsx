import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { AuthGate } from '../components/AuthGate';
import { PricingCard } from '../components/PricingCard';
import { hasActiveSubscription, loadBillingState, type BillingState } from '../lib/credits';
import { startPolarCheckout, type PaidPlanKey } from '../lib/payments';
import { pricingPlans, pricingText } from '../lib/pricingPlans';
import type { Lang } from '../lib/types';

export function PricingPage({ lang, onLangChange }: { lang: Lang; onLangChange?: (lang: Lang) => void }) {
  return (
    <AuthGate lang={lang} onLangChange={onLangChange}>
      <PricingContent lang={lang} />
    </AuthGate>
  );
}

function PricingContent({ lang }: { lang: Lang }) {
  const [billing, setBilling] = useState<BillingState>({ balance: 0 });
  const [busyPlan, setBusyPlan] = useState<PaidPlanKey | null>(null);
  const [message, setMessage] = useState('');
  const copy = pricingText[lang];
  const checkoutState = new URLSearchParams(window.location.search).get('checkout');

  useEffect(() => {
    let stopped = false;

    async function refreshBilling() {
      try {
        const nextBilling = await loadBillingState();
        if (!stopped) setBilling(nextBilling);
      } catch {
        if (!stopped) setMessage(copy.loadError);
      }
    }

    refreshBilling();
    if (checkoutState === 'success') {
      setMessage(copy.ready);
      const timers = [1200, 3500, 7000].map((delay) => window.setTimeout(refreshBilling, delay));
      return () => {
        stopped = true;
        timers.forEach(window.clearTimeout);
      };
    }
    if (checkoutState === 'cancel') setMessage(copy.canceled);

    return () => {
      stopped = true;
    };
  }, [checkoutState, copy.canceled, copy.loadError, copy.ready]);

  async function buy(productKey: PaidPlanKey) {
    setBusyPlan(productKey);
    setMessage(copy.wait);
    try {
      await startPolarCheckout(productKey);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy.checkoutError);
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
          <span>{copy.balance}</span>
          <strong>{hasActiveSubscription(billing) ? copy.yearly : billing.balance}</strong>
        </div>
      </section>
      {message && <section className="panel message">{message}</section>}
      <section className="pricing-grid">
        {pricingPlans.map((plan) => (
          <PricingCard
            key={plan.productKey}
            {...plan}
            {...copy.plans[plan.productKey]}
            bestLabel={copy.best}
            busy={busyPlan === plan.productKey}
            onBuy={buy}
          />
        ))}
      </section>
      <footer className="pricing-footer">
        <span aria-hidden="true">🔒</span>
        <p>{copy.secure}</p>
        <Link href="/auth" className="account-link secondary">{copy.account}</Link>
      </footer>
    </div>
  );
}
