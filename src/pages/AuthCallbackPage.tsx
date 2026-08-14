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
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const code = params.get('code');
      const error = params.get('error') ?? hashParams.get('error');
      const errorDescription = params.get('error_description') ?? hashParams.get('error_description');

      if (error) {
        setMessage(errorDescription ?? error);
        return;
      }

      if (code) {
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setMessage(exchangeError.message);
          return;
        }
        if (data.session) {
          navigate('/');
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate('/');
        return;
      }

      setMessage(
        code
          ? `${callbackErrorText[lang]} OAuth code was received, but no session was created.`
          : `${callbackErrorText[lang]} The callback URL has no OAuth code.`,
      );
    }

    void finishSignIn();
  }, [navigate, lang]);

  return <section className="panel">{message}</section>;
}

const callbackErrorText: Record<Lang, string> = {
  ru: 'Вход не завершился: Supabase не вернул сессию. Проверь настройки Lichess OAuth и Redirect URLs.',
  en: 'Sign-in did not finish: Supabase did not return a session. Check the Lichess OAuth and Redirect URL settings.',
  kk: 'Кіру аяқталмады: Supabase сессия қайтармады. Lichess OAuth және Redirect URL баптауларын тексер.',
};
