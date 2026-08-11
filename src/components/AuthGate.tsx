import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Auth } from './Auth';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { SupabaseSetupMessage } from './SupabaseSetupMessage';

type Props = { children: React.ReactNode };

export function AuthGate({ children }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [demo, setDemo] = useState(() => window.localStorage.getItem('chess-demo-mode') === '1');

  useEffect(() => {
    const onDemo = () => {
      setDemo(true);
      setReady(true);
    };
    window.addEventListener('chess-demo-mode', onDemo);
    return () => window.removeEventListener('chess-demo-mode', onDemo);
  }, []);

  useEffect(() => {
    if (demo) {
      setReady(true);
      return;
    }
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
  }, [demo]);

  if (!isSupabaseConfigured) return <SupabaseSetupMessage />;
  if (!ready) return <section className="panel">Loading...</section>;
  if (!session && !demo) return <Auth />;
  return <>{children}</>;
}
