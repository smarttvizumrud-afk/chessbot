import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { AuthGate } from '../components/AuthGate';
import { PricingCard } from '../components/PricingCard';
import { hasUnlimitedAccess, loadCreditBalance, type CreditBalance } from '../lib/credits';
import { startPolarCheckout, type PaidPlanKey, type PricingPlanKey } from '../lib/payments';
import type { Lang } from '../lib/types';

type Plan = {
  productKey: PricingPlanKey;
  price: string;
  icon: string;
  highlighted?: boolean;
};

type PlanText = {
  title: string;
  action: string;
  caption?: string;
};

const plans: Plan[] = [
  { productKey: 'trial', price: '$0', icon: '0' },
  { productKey: 'credits_50', price: '$5', icon: '50' },
  { productKey: 'credits_100', price: '$10', icon: '100', highlighted: true },
  { productKey: 'unlimited_year', price: '$35', icon: '∞' },
];

const text: Record<Lang, {
  title: string;
  kicker: string;
  secure: string;
  wait: string;
  ready: string;
  balance: string;
  unlimited: string;
  account: string;
  best: string;
  loadError: string;
  checkoutError: string;
  plans: Record<PricingPlanKey, PlanText>;
}> = {
  ru: {
    title: 'Кредиты',
    kicker: 'Покупай кредиты для AI-анализа после входа.',
    secure: 'Безопасная оплата. Кредиты появятся после подтверждения платежа.',
    wait: 'Открываю оплату...',
    ready: 'Платёж получен. Баланс обновится после подтверждения.',
    balance: 'Баланс',
    unlimited: 'Безлимит',
    account: 'Аккаунт',
    best: 'Лучший выбор',
    loadError: 'Не удалось загрузить кредиты.',
    checkoutError: 'Не удалось открыть оплату.',
    plans: {
      trial: { title: 'Пробный доступ', action: 'Включено' },
      credits_50: { title: '50 кредитов', action: 'Купить' },
      credits_100: { title: '100 кредитов', action: 'Купить' },
      unlimited_year: { title: 'Безлимит на 1 год', action: 'Оформить', caption: 'от' },
    },
  },
  en: {
    title: 'Credits',
    kicker: 'Buy extra AI analysis credits after sign in.',
    secure: 'Secure payment. Credits appear after the Polar webhook is verified.',
    wait: 'Opening checkout...',
    ready: 'Payment received. Balance updates after verification.',
    balance: 'Balance',
    unlimited: 'Unlimited',
    account: 'Account',
    best: 'Best value',
    loadError: 'Could not load credits.',
    checkoutError: 'Could not open checkout.',
    plans: {
      trial: { title: 'Free trial', action: 'Included' },
      credits_50: { title: '50 credits', action: 'Buy now' },
      credits_100: { title: '100 credits', action: 'Buy now' },
      unlimited_year: { title: '1 year unlimited', action: 'Subscribe', caption: 'from' },
    },
  },
  kk: {
    title: 'Кредиттер',
    kicker: 'Кіргеннен кейін AI талдауына қосымша кредит сатып ал.',
    secure: 'Қауіпсіз төлем. Кредиттер төлем расталғаннан кейін қосылады.',
    wait: 'Төлем бетін ашып жатырмын...',
    ready: 'Төлем алынды. Баланс растаудан кейін жаңарады.',
    balance: 'Баланс',
    unlimited: 'Шексіз',
    account: 'Аккаунт',
    best: 'Ең тиімді',
    loadError: 'Кредиттерді жүктеу мүмкін болмады.',
    checkoutError: 'Төлемді ашу мүмкін болмады.',
    plans: {
      trial: { title: 'Сынақ қолжетімділігі', action: 'Қосылған' },
      credits_50: { title: '50 кредит', action: 'Сатып алу' },
      credits_100: { title: '100 кредит', action: 'Сатып алу' },
      unlimited_year: { title: '1 жыл шексіз', action: 'Жазылу', caption: 'бастап' },
    },
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
    loadCreditBalance().then(setBalance).catch(() => setMessage(copy.loadError));
  }, [copy.loadError]);

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
          <strong>{hasUnlimitedAccess(balance) ? copy.unlimited : balance.balance}</strong>
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
