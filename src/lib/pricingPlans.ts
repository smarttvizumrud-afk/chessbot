import type { Lang } from './types';
import type { PricingPlanKey } from './payments';

export type PricingPlan = {
  productKey: PricingPlanKey;
  price: string;
  icon: string;
  highlighted?: boolean;
};

export type PlanText = {
  title: string;
  action: string;
  caption?: string;
};

export type PricingText = {
  title: string;
  kicker: string;
  secure: string;
  wait: string;
  ready: string;
  canceled: string;
  balance: string;
  yearly: string;
  account: string;
  best: string;
  promoTitle: string;
  promoPlaceholder: string;
  promoAction: string;
  promoSuccess: string;
  promoSubscriptionSuccess: string;
  loadError: string;
  checkoutError: string;
  plans: Record<PricingPlanKey, PlanText>;
};

export const pricingPlans: PricingPlan[] = [
  { productKey: 'trial', price: '$0', icon: '0' },
  { productKey: 'credits_50', price: '$5', icon: '50' },
  { productKey: 'credits_100', price: '$10', icon: '100', highlighted: true },
  { productKey: 'unlimited_year', price: '$35', icon: '∞' },
];

export const pricingText: Record<Lang, PricingText> = {
  ru: {
    title: 'Кредиты',
    kicker: 'Покупай кредиты для AI-анализа после входа.',
    secure: 'Безопасная оплата. Доступ появляется только после проверки webhook от Polar.',
    wait: 'Открываю оплату...',
    ready: 'Платеж получен. Сейчас проверяю баланс и подписку в базе.',
    canceled: 'Оплата отменена. Деньги не списаны.',
    balance: 'Баланс',
    yearly: 'Годовой доступ',
    account: 'Аккаунт',
    best: 'Лучший выбор',
    promoTitle: 'Промокод',
    promoPlaceholder: 'CHESA2026',
    promoAction: 'Применить',
    promoSuccess: '+{credits} кредитов',
    promoSubscriptionSuccess: 'Годовая подписка включена на аккаунте.',
    loadError: 'Не удалось загрузить данные оплаты.',
    checkoutError: 'Не удалось открыть оплату.',
    plans: {
      trial: { title: 'Пробный доступ', action: 'Включено' },
      credits_50: { title: '50 кредитов', action: 'Купить' },
      credits_100: { title: '100 кредитов', action: 'Купить' },
      unlimited_year: { title: 'Годовая подписка', action: 'Оформить', caption: 'от' },
    },
  },
  en: {
    title: 'Credits',
    kicker: 'Buy extra AI analysis credits after sign in.',
    secure: 'Secure payment. Access appears only after the Polar webhook is verified.',
    wait: 'Opening checkout...',
    ready: 'Payment received. Checking your balance and subscription in the database.',
    canceled: 'Checkout canceled. You were not charged.',
    balance: 'Balance',
    yearly: 'Yearly access',
    account: 'Account',
    best: 'Best value',
    promoTitle: 'Promo code',
    promoPlaceholder: 'CHESA2026',
    promoAction: 'Apply',
    promoSuccess: '+{credits} credits',
    promoSubscriptionSuccess: 'Yearly subscription is active on this account.',
    loadError: 'Could not load billing data.',
    checkoutError: 'Could not open checkout.',
    plans: {
      trial: { title: 'Free trial', action: 'Included' },
      credits_50: { title: '50 credits', action: 'Buy now' },
      credits_100: { title: '100 credits', action: 'Buy now' },
      unlimited_year: { title: 'Yearly subscription', action: 'Subscribe', caption: 'from' },
    },
  },
  kk: {
    title: 'Кредиттер',
    kicker: 'Кіргеннен кейін AI талдауына қосымша кредит сатып ал.',
    secure: 'Қауіпсіз төлем. Қолжетімділік Polar webhook тексерілгеннен кейін ғана қосылады.',
    wait: 'Төлем бетін ашып жатырмын...',
    ready: 'Төлем алынды. Баланс пен жазылымды базадан тексеріп жатырмын.',
    canceled: 'Төлем тоқтатылды. Ақша алынған жоқ.',
    balance: 'Баланс',
    yearly: 'Жылдық қолжетімділік',
    account: 'Аккаунт',
    best: 'Ең тиімді',
    promoTitle: 'Промокод',
    promoPlaceholder: 'CHESA2026',
    promoAction: 'Қолдану',
    promoSuccess: '+{credits} кредит',
    promoSubscriptionSuccess: 'Жылдық жазылым аккаунтта қосылды.',
    loadError: 'Төлем деректерін жүктеу мүмкін болмады.',
    checkoutError: 'Төлемді ашу мүмкін болмады.',
    plans: {
      trial: { title: 'Сынақ қолжетімділік', action: 'Қосылған' },
      credits_50: { title: '50 кредит', action: 'Сатып алу' },
      credits_100: { title: '100 кредит', action: 'Сатып алу' },
      unlimited_year: { title: 'Жылдық жазылым', action: 'Жазылу', caption: 'бастап' },
    },
  },
};
