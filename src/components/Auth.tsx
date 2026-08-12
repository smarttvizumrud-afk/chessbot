import { useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { SupabaseSetupMessage } from './SupabaseSetupMessage';
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

  async function handleGoogleSignIn() {
    setBusy(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setBusy(false);
      setMessage(error.message);
    }
  }

  async function handleLichessSignIn() {
    setBusy(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'custom:lichess',
      options: {
        redirectTo: window.location.origin,
        scopes: 'preference:read',
      },
    });
    if (error) {
      setBusy(false);
      setMessage(error.message);
    }
  }

  return (
    <section className="auth-card">
      <h1>{t(lang, 'authTitle')}</h1>
      <p>{t(lang, 'authText')}</p>
      <h2 className="auth-heading">{registrationText[lang]}</h2>
      <button className="google-button" type="button" onClick={handleGoogleSignIn} disabled={busy}>
        <span>G</span>
        {googleButtonText[lang]}
      </button>
      <div className="auth-divider">{emailDividerText[lang]}</div>
      <form onSubmit={handleSubmit} className="coach-form">
        <input type="email" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder={t(lang, 'password')} value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
        <button type="submit" disabled={busy}>{busy ? '...' : mode === 'signin' ? t(lang, 'signIn') : t(lang, 'createAccount')}</button>
      </form>
      {message && <p className="message">{message}</p>}
      <button className="ghost" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
        {mode === 'signin' ? t(lang, 'createAccount') : t(lang, 'haveAccount')}
      </button>
      <div className="auth-divider">{oauthDividerText[lang]}</div>
      <button className="lichess-button" type="button" onClick={handleLichessSignIn} disabled={busy}>
        <span>♞</span>
        {lichessButtonText[lang]}
      </button>
    </section>
  );
}

const registrationText: Record<Lang, string> = {
  ru: '\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f',
  en: 'Registration',
  kk: '\u0422\u0456\u0440\u043a\u0435\u043b\u0443',
};

const googleButtonText: Record<Lang, string> = {
  ru: '\u0412\u043e\u0439\u0442\u0438 \u0447\u0435\u0440\u0435\u0437 Google',
  en: 'Continue with Google',
  kk: 'Google \u0430\u0440\u049b\u044b\u043b\u044b \u043a\u0456\u0440\u0443',
};

const emailDividerText: Record<Lang, string> = {
  ru: '\u0438\u043b\u0438 \u0447\u0435\u0440\u0435\u0437 email',
  en: 'or email',
  kk: '\u043d\u0435\u043c\u0435\u0441\u0435 email',
};

const oauthDividerText: Record<Lang, string> = {
  ru: '\u0438\u043b\u0438',
  en: 'or',
  kk: '\u043d\u0435\u043c\u0435\u0441\u0435',
};

const lichessButtonText: Record<Lang, string> = {
  ru: '\u0412\u043e\u0439\u0442\u0438 \u0447\u0435\u0440\u0435\u0437 Lichess',
  en: 'Continue with Lichess',
  kk: 'Lichess \u0430\u0440\u049b\u044b\u043b\u044b \u043a\u0456\u0440\u0443',
};
