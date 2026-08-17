import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useLocation } from 'wouter';
import { AccountProfile } from '../components/AccountProfile';
import { Auth } from '../components/Auth';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { SupabaseSetupMessage } from '../components/SupabaseSetupMessage';
import { t } from '../lib/i18n';
import type { Lang } from '../lib/types';
import { useChessData } from '../lib/useChessData';
import { isOnboardingComplete } from '../lib/userOnboarding';
import { OnboardingForm } from '../components/OnboardingForm';

export function AuthPage({ lang, onLangChange }: { lang: Lang; onLangChange?: (lang: Lang) => void }) {
  const [, navigate] = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const { games, profiles } = useChessData();

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

  async function refreshSession() {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
  }

  if (!isSupabaseConfigured) return <SupabaseSetupMessage />;
  if (!ready) return <section className="panel">{t(lang, 'loading')}</section>;
  if (!session) return <Auth lang={lang} />;
  if (!isOnboardingComplete(session.user.user_metadata)) {
    return (
      <OnboardingForm
        lang={lang}
        metadata={session.user.user_metadata}
        onComplete={refreshSession}
        onLangChange={onLangChange}
      />
    );
  }

  return (
    <AccountProfile
      session={session}
      profiles={profiles}
      games={games}
      busy={busy}
      lang={lang}
      onSignOut={signOut}
    />
  );
}
