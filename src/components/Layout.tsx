import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Link, useLocation } from 'wouter';
import type { Lang } from '../lib/types';
import { t } from '../lib/i18n';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

type Props = {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  children: React.ReactNode;
};

const nav = [
  ['/', 'dashboard'],
  ['/openings', 'openings'],
  ['/coach', 'coach'],
] as const;

const authLinkText: Record<Lang, string> = {
  ru: '\u0412\u043e\u0439\u0442\u0438 / \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f',
  en: 'Sign in / register',
  kk: '\u041a\u0456\u0440\u0443 / \u0442\u0456\u0440\u043a\u0435\u043b\u0443',
};

export function Layout({ lang, onLangChange, children }: Props) {
  const [location] = useLocation();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const avatarUrl = getMetadataString(session?.user.user_metadata, 'avatar_url')
    ?? getMetadataString(session?.user.user_metadata, 'picture');
  const accountInitial = getAccountInitial(session?.user.email);

  return (
    <main className="shell">
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-mark">♜</span>
          <span>{t(lang, 'app')}</span>
        </Link>
        <nav className="nav">
          {nav.map(([href, key]) => (
            <Link key={href} href={href} className={location === href ? 'active' : ''}>
              {t(lang, key)}
            </Link>
          ))}
        </nav>
        <div className="account-menu">
          <select className="lang-select" value={lang} onChange={(event) => onLangChange(event.target.value as Lang)}>
            <option value="ru">RU</option>
            <option value="en">EN</option>
            <option value="kk">KK</option>
          </select>
          <Link href="/auth" className={session ? 'account-link profile-link' : 'account-link'}>
            {session ? (
              avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{accountInitial}</span>
            ) : authLinkText[lang]}
          </Link>
        </div>
      </header>
      {children}
    </main>
  );
}

function getMetadataString(metadata: unknown, key: string): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === 'string' && value ? value : null;
}

function getAccountInitial(email?: string): string {
  return email?.trim().charAt(0).toUpperCase() || 'A';
}
