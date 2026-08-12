import { Link, useLocation } from 'wouter';
import type { Lang } from '../lib/types';
import { t } from '../lib/i18n';

type Props = {
  lang: Lang;
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

export function Layout({ lang, children }: Props) {
  const [location] = useLocation();

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
        <Link href="/auth" className="account-link">
          {authLinkText[lang]}
        </Link>
      </header>
      {children}
    </main>
  );
}
