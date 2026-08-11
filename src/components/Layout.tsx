import { Link, useLocation } from 'wouter';
import type { Lang } from '../lib/types';
import { t } from '../lib/i18n';

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

export function Layout({ lang, onLangChange, children }: Props) {
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
        <select value={lang} onChange={(event) => onLangChange(event.target.value as Lang)}>
          <option value="ru">RU</option>
          <option value="en">EN</option>
          <option value="kk">KK</option>
        </select>
      </header>
      {children}
    </main>
  );
}
