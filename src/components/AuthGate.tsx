import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Auth } from './Auth';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { SupabaseSetupMessage } from './SupabaseSetupMessage';
import { t } from '../lib/i18n';
import type { Lang } from '../lib/types';

type Props = { children: React.ReactNode; lang: Lang };

export function AuthGate({ children, lang }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

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

  if (!isSupabaseConfigured) return <SupabaseSetupMessage />;
  if (!ready) return <section className="panel">{t(lang, 'loading')}</section>;
  if (!session) return <Auth lang={lang} />;
  return <>{children}</>;
}
