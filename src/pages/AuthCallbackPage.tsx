import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '../lib/supabase';
import { t } from '../lib/i18n';
import type { Lang } from '../lib/types';

export function AuthCallbackPage({ lang }: { lang: Lang }) {
  const [, navigate] = useLocation();
  const [message, setMessage] = useState(t(lang, 'loading'));

  useEffect(() => {
    async function finishSignIn() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMessage(error.message);
          return;
        }
      }

      navigate('/');
    }

    void finishSignIn();
  }, [navigate, lang]);

  return <section className="panel">{message}</section>;
}
