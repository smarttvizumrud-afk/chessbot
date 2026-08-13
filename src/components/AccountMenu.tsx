import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Link } from 'wouter';
import type { AppTheme, Lang, PieceStyle } from '../lib/types';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { LanguageSelect, PieceStyleSelect, ThemeSelect } from './MenuSelects';

type Props = {
  lang: Lang;
  theme: AppTheme;
  pieceStyle: PieceStyle;
  onLangChange: (lang: Lang) => void;
  onThemeChange: (theme: AppTheme) => void;
  onPieceStyleChange: (pieceStyle: PieceStyle) => void;
};

const authLinkText: Record<Lang, string> = {
  ru: '\u0412\u043e\u0439\u0442\u0438 / \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f',
  en: 'Sign in / register',
  kk: '\u041a\u0456\u0440\u0443 / \u0442\u0456\u0440\u043a\u0435\u043b\u0443',
};

const menuLabels: Record<Lang, {
  language: string;
  sound: string;
  theme: string;
  board: string;
  pieces: string;
}> = {
  ru: {
    language: '\u042f\u0437\u044b\u043a (Language)',
    sound: '\u0417\u0432\u0443\u043a',
    theme: '\u0422\u0435\u043c\u0430',
    board: '\u0414\u043e\u0441\u043a\u0430',
    pieces: '\u041e\u0444\u043e\u0440\u043c\u043b\u0435\u043d\u0438\u0435 \u0444\u0438\u0433\u0443\u0440',
  },
  en: { language: 'Language', sound: 'Sound', theme: 'Theme', board: 'Board', pieces: 'Pieces' },
  kk: {
    language: '\u0422\u0456\u043b (Language)',
    sound: '\u0414\u044b\u0431\u044b\u0441',
    theme: '\u0422\u0430\u049b\u044b\u0440\u044b\u043f',
    board: '\u0422\u0430\u049b\u0442\u0430',
    pieces: '\u0424\u0438\u0433\u0443\u0440\u0430\u043b\u0430\u0440',
  },
};

export function AccountMenu({
  lang,
  theme,
  pieceStyle,
  onLangChange,
  onThemeChange,
  onPieceStyleChange,
}: Props) {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!session) {
    return (
      <div className="account-menu">
        <LanguageSelect lang={lang} onLangChange={onLangChange} className="lang-select" />
        <Link href="/auth" className="account-link">{authLinkText[lang]}</Link>
      </div>
    );
  }

  const avatarUrl = getMetadataString(session.user.user_metadata, 'avatar_url')
    ?? getMetadataString(session.user.user_metadata, 'picture');
  const displayName = getDisplayName(session);

  return (
    <div className="account-menu">
      <div className="profile-menu-wrap">
        <Link href="/auth" className="account-link profile-link">
          {avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{getAccountInitial(displayName)}</span>}
        </Link>
        <AccountHoverMenu
          lang={lang}
          theme={theme}
          pieceStyle={pieceStyle}
          onLangChange={onLangChange}
          onThemeChange={onThemeChange}
          onPieceStyleChange={onPieceStyleChange}
        />
      </div>
    </div>
  );
}

function AccountHoverMenu({
  lang,
  theme,
  pieceStyle,
  onLangChange,
  onThemeChange,
  onPieceStyleChange,
}: Props) {
  const labels = menuLabels[lang];

  return (
    <div className="profile-popover">
      <label className="settings-row">
        <span>{labels.language}</span>
        <LanguageSelect lang={lang} onLangChange={onLangChange} className="menu-lang-select" />
      </label>
      <SettingsRow label={labels.sound} />
      <label className="settings-row active">
        <span>{labels.theme}</span>
        <ThemeSelect theme={theme} onThemeChange={onThemeChange} />
      </label>
      <SettingsRow label={labels.board} />
      <label className="settings-row">
        <span>{labels.pieces}</span>
        <PieceStyleSelect pieceStyle={pieceStyle} onPieceStyleChange={onPieceStyleChange} />
      </label>
      <div className="connection-stats">
        <div>PING 139 ms</div>
        <div>SERVER ? ms</div>
        <span className="signal-bars"><i /><i /><i /><i /></span>
      </div>
    </div>
  );
}

function SettingsRow({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <div className={active ? 'settings-row active' : 'settings-row'}>
      <span>{label}</span>
      <span className="settings-chevron">&gt;</span>
    </div>
  );
}

function getMetadataString(metadata: unknown, key: string): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === 'string' && value ? value : null;
}

function getDisplayName(session: Session): string {
  return getMetadataString(session.user.user_metadata, 'username')
    ?? getMetadataString(session.user.user_metadata, 'preferred_username')
    ?? getMetadataString(session.user.user_metadata, 'name')
    ?? getMetadataString(session.user.user_metadata, 'full_name')
    ?? session.user.email
    ?? session.user.id;
}

function getAccountInitial(name?: string): string {
  return name?.trim().charAt(0).toUpperCase() || 'A';
}
