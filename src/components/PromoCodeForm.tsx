import { useState } from 'react';
import { redeemPromoCode } from '../lib/promos';

type Props = {
  title: string;
  placeholder: string;
  action: string;
  success: (credits: number) => string;
  onApplied: () => Promise<void>;
};

export function PromoCodeForm({ title, placeholder, action, success, onApplied }: Props) {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;

    const cleanCode = code.trim();
    if (!cleanCode) return;

    setBusy(true);
    setMessage('');
    try {
      const credits = await redeemPromoCode(cleanCode);
      setCode('');
      setMessage(success(credits));
      await onApplied();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not apply promo code.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="promo-card" onSubmit={submit}>
      <span>{title}</span>
      <div className="promo-row">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder={placeholder}
          maxLength={40}
          autoComplete="off"
        />
        <button type="submit" disabled={busy || !code.trim()}>{busy ? '...' : action}</button>
      </div>
      {message && <p>{message}</p>}
    </form>
  );
}
