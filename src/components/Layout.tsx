import { Link, useLocation } from 'wouter';
import type { AppTheme, Lang } from '../lib/types';
import { t } from '../lib/i18n';
import { AccountMenu } from './AccountMenu';

type Props = {
  lang: Lang;
  theme: AppTheme;
  onLangChange: (lang: Lang) => void;
  onThemeChange: (theme: AppTheme) => void;
  children: React.ReactNode;
};

const nav = [
  ['/', 'dashboard'],
  ['/openings', 'openings'],
  ['/coach', 'coach'],
] as const;

export function Layout({ lang, theme, onLangChange, onThemeChange, children }: Props) {
  const [location] = useLocation();

  return (
    <main className={`shell theme-${theme}`}>
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
        <AccountMenu lang={lang} theme={theme} onLangChange={onLangChange} onThemeChange={onThemeChange} />
      </header>
      {children}
    </main>
  );
}
