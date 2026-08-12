import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Link, useLocation } from 'wouter';
import { Auth } from '../components/Auth';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { SupabaseSetupMessage } from '../components/SupabaseSetupMessage';
import { t } from '../lib/i18n';
import type { Lang } from '../lib/types';

export function AuthPage({ lang }: { lang: Lang }) {
  const [, navigate] = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function signOut() {
    setBusy(true);
    await supabase.auth.signOut();
    setBusy(false);
    navigate('/');
  }

  if (!isSupabaseConfigured) return <SupabaseSetupMessage />;
  if (!ready) return <section className="panel">{t(lang, 'loading')}</section>;
  if (!session) return <Auth lang={lang} />;

  return (
    <section className="auth-card">
      <h1>{accountTitle[lang]}</h1>
      <p>{session.user.email ?? accountText[lang]}</p>
      <div className="account-actions">
        <Link href="/" className="account-link secondary">
          {homeText[lang]}
        </Link>
        <button type="button" onClick={signOut} disabled={busy}>
          {busy ? '...' : signOutText[lang]}
        </button>
      </div>
    </section>
  );
}

const accountTitle: Record<Lang, string> = {
  ru: '\u0410\u043a\u043a\u0430\u0443\u043d\u0442',
  en: 'Account',
  kk: '\u0410\u043a\u043a\u0430\u0443\u043d\u0442',
};

const accountText: Record<Lang, string> = {
  ru: '\u0422\u044b \u0443\u0436\u0435 \u0432\u043e\u0448\u0451\u043b.',
  en: 'You are signed in.',
  kk: '\u0421\u0435\u043d \u043a\u0456\u0440\u0434\u0456\u04a3.',
};

const homeText: Record<Lang, string> = {
  ru: '\u041d\u0430 \u0433\u043b\u0430\u0432\u043d\u0443\u044e',
  en: 'Go home',
  kk: '\u0411\u0430\u0441\u0442\u044b \u0431\u0435\u0442\u043a\u0435',
};

const signOutText: Record<Lang, string> = {
  ru: '\u0412\u044b\u0439\u0442\u0438',
  en: 'Sign out',
  kk: '\u0428\u044b\u0493\u0443',
};
