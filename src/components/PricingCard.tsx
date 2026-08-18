import type { PaidPlanKey, PricingPlanKey } from '../lib/payments';

type Props = {
  title: string;
  price: string;
  caption?: string;
  icon: string;
  action: string;
  bestLabel: string;
  productKey: PricingPlanKey;
  highlighted?: boolean;
  busy: boolean;
  onBuy: (productKey: PaidPlanKey) => void;
};

export function PricingCard({
  title,
  price,
  caption,
  icon,
  action,
  bestLabel,
  productKey,
  highlighted,
  busy,
  onBuy,
}: Props) {
  const className = highlighted ? 'pricing-card highlighted' : 'pricing-card';
  const isTrial = productKey === 'trial';

  return (
    <article className={className}>
      {highlighted && <div className="best-badge">{bestLabel}</div>}
      <span className="plan-pill">{title}</span>
      <div className="plan-icon" aria-hidden="true">{icon}</div>
      <div className="price-line">
        {caption && <span>{caption}</span>}
        <strong>{price}</strong>
      </div>
      <button
        type="button"
        disabled={busy || isTrial}
        onClick={() => !isTrial && onBuy(productKey)}
      >
        {action}
      </button>
    </article>
  );
}
