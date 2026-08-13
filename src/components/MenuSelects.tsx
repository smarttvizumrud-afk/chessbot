import type { AppTheme, Lang, PieceStyle } from '../lib/types';

export function LanguageSelect({
  lang,
  onLangChange,
  className,
}: {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  className: string;
}) {
  return (
    <select className={className} value={lang} onChange={(event) => onLangChange(event.target.value as Lang)}>
      <option value="ru">RU</option>
      <option value="en">EN</option>
      <option value="kk">KK</option>
    </select>
  );
}

export function ThemeSelect({
  theme,
  onThemeChange,
}: {
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
}) {
  return (
    <select className="menu-theme-select" value={theme} onChange={(event) => onThemeChange(event.target.value as AppTheme)}>
      <option value="dark">Dark</option>
      <option value="green">Green</option>
      <option value="light">Light</option>
    </select>
  );
}

export function PieceStyleSelect({
  pieceStyle,
  onPieceStyleChange,
}: {
  pieceStyle: PieceStyle;
  onPieceStyleChange: (pieceStyle: PieceStyle) => void;
}) {
  return (
    <select
      className="menu-piece-select"
      value={pieceStyle}
      onChange={(event) => onPieceStyleChange(event.target.value as PieceStyle)}
    >
      <option value="classic">Classic</option>
      <option value="alpha">Alpha</option>
      <option value="neo">Neo</option>
    </select>
  );
}
