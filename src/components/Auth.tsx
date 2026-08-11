import { useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { SupabaseSetupMessage } from './SupabaseSetupMessage';
import { enableDemoMode } from '../lib/demoStorage';
import { t } from '../lib/i18n';
import type { Lang } from '../lib/types';

export function Auth({ lang }: { lang: Lang }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  if (!isSupabaseConfigured) return <SupabaseSetupMessage />;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const action = mode === 'signup'
      ? supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
      : supabase.auth.signInWithPassword({ email, password });
    const { error } = await action;
    setBusy(false);
    setMessage(error ? error.message : mode === 'signup' ? t(lang, 'checkEmail') : '');
  }

  return (
    <section className="auth-card">
      <h1>{t(lang, 'authTitle')}</h1>
      <p>{t(lang, 'authText')}</p>
      <form onSubmit={handleSubmit} className="coach-form">
        <input type="email" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder={t(lang, 'password')} value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
        <button type="submit" disabled={busy}>{busy ? '...' : mode === 'signin' ? t(lang, 'signIn') : t(lang, 'createAccount')}</button>
      </form>
      {message && <p className="message">{message}</p>}
      <button className="ghost" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
        {mode === 'signin' ? t(lang, 'createAccount') : t(lang, 'haveAccount')}
      </button>
      <button className="ghost" onClick={enableDemoMode}>
        {t(lang, 'demoMode')}
      </button>
    </section>
  );
}
