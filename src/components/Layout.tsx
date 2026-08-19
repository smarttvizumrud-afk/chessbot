import { Link, useLocation } from 'wouter';
import type { AppTheme, BoardStyle, Lang, PieceStyle } from '../lib/types';
import type { InterfaceMode } from '../lib/userOnboarding';
import { t } from '../lib/i18n';
import { AccountMenu } from './AccountMenu';

type Props = {
  lang: Lang;
  theme: AppTheme;
  interfaceMode: InterfaceMode;
  boardStyle: BoardStyle;
  pieceStyle: PieceStyle;
  onLangChange: (lang: Lang) => void;
  onThemeChange: (theme: AppTheme) => void;
  onBoardStyleChange: (boardStyle: BoardStyle) => void;
  onPieceStyleChange: (pieceStyle: PieceStyle) => void;
  children: React.ReactNode;
};

const nav = [
  ['/', 'dashboard'],
  ['/openings', 'openings'],
  ['/puzzles', 'puzzles'],
  ['/coach', 'coach'],
  ['/pricing', 'pricing'],
] as const;

export function Layout({
  lang,
  theme,
  interfaceMode,
  boardStyle,
  pieceStyle,
  onLangChange,
  onThemeChange,
  onBoardStyleChange,
  onPieceStyleChange,
  children,
}: Props) {
  const [location] = useLocation();

  return (
    <main className={`shell theme-${theme} interface-${interfaceMode}`}>
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <img src="/chesa-logo.png" alt="" />
          </span>
          <span>{t(lang, 'app')}</span>
        </Link>
        <nav className="nav">
          {nav.map(([href, key]) => (
            <Link key={href} href={href} className={location === href ? 'active' : ''}>
              {t(lang, key)}
            </Link>
          ))}
        </nav>
        <AccountMenu
          lang={lang}
          theme={theme}
          boardStyle={boardStyle}
          pieceStyle={pieceStyle}
          onLangChange={onLangChange}
          onThemeChange={onThemeChange}
          onBoardStyleChange={onBoardStyleChange}
          onPieceStyleChange={onPieceStyleChange}
        />
      </header>
      {children}
    </main>
  );
}
