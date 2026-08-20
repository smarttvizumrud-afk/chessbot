import { useCallback, useEffect, useState } from 'react';
import { Link } from 'wouter';
import { AuthGate } from '../components/AuthGate';
import { PricingCard } from '../components/PricingCard';
import { PromoCodeForm } from '../components/PromoCodeForm';
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

  const refreshBilling = useCallback(async () => {
    try {
      const nextBilling = await loadBillingState();
      setBilling(nextBilling);
    } catch {
      setMessage(copy.loadError);
    }
  }, [copy.loadError]);

  useEffect(() => {
    let stopped = false;
    const refreshIfActive = () => {
      if (!stopped) refreshBilling();
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refreshIfActive();
    };

    refreshIfActive();
    window.addEventListener('focus', refreshIfActive);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    const cleanupRefresh = () => {
      stopped = true;
      window.removeEventListener('focus', refreshIfActive);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };

    if (checkoutState === 'success') {
      setMessage(copy.ready);
      const timers = [1200, 3500, 7000].map((delay) => window.setTimeout(refreshIfActive, delay));
      return () => {
        cleanupRefresh();
        timers.forEach(window.clearTimeout);
      };
    }
    if (checkoutState === 'cancel') setMessage(copy.canceled);

    return cleanupRefresh;
  }, [checkoutState, copy.canceled, copy.ready, refreshBilling]);

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
        <div className="billing-tools">
          <PromoCodeForm
            title={copy.promoTitle}
            placeholder={copy.promoPlaceholder}
            action={copy.promoAction}
            success={(result) => result.subscription
              ? copy.promoSubscriptionSuccess
              : copy.promoSuccess.replace('{credits}', String(result.credits))}
            onApplied={refreshBilling}
          />
          <div className="credit-status">
            <span>{copy.balance}</span>
            <strong>{hasActiveSubscription(billing) ? copy.yearly : billing.balance}</strong>
          </div>
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
