import type { Session } from '@supabase/supabase-js';
import { Link } from 'wouter';
import type { Lang, StoredGame, StoredProfile } from '../lib/types';

type Props = {
  session: Session;
  profiles: StoredProfile[];
  games: StoredGame[];
  busy: boolean;
  lang: Lang;
  onSignOut: () => void;
};

const signOutText: Record<Lang, string> = {
  ru: '\u0412\u044b\u0439\u0442\u0438',
  en: 'Sign out',
  kk: '\u0428\u044b\u0493\u0443',
};

export function AccountProfile({ session, profiles, games, busy, lang, onSignOut }: Props) {
  const profile = profiles[0];
  const username = profile?.username || getDisplayName(session);
  const counts = getModeCounts(games);

  return (
    <section className="lichess-profile">
      <aside className="profile-side">
        <RatingMode label="ПУЛЯ" value="?" count={counts.bullet} />
        <RatingMode label="БЛИЦ" value={profile?.blitz} count={counts.blitz} />
        <RatingMode label="РАПИД" value={profile?.rapid} count={counts.rapid} />
        <RatingMode label="КЛАССИКА" value={profile?.classical} count={counts.classical} />
        <div className="profile-side-line" />
        <RatingMode label="ЗАДАЧИ" value="?" count={0} />
      </aside>

      <div className="profile-main">
        <header className="profile-hero-row">
          <span className="online-dot" />
          <h1>{username}</h1>
        </header>

        <div className="profile-actions-bar">
          <button type="button" className="profile-tool">⚙ Редактировать профиль</button>
          <Link href="/" className="profile-tool">▣ Просмотр</Link>
          <Link href="/" className="profile-tool">⬇ Скачать игры</Link>
          <button type="button" className="profile-tool muted-tool">Ещё ▾</button>
        </div>

        <div className="profile-content-grid">
          <div className="profile-chart">
            <button type="button" className="all-filter">ALL</button>
            <div className="chart-lines">
              <span>1450</span>
              <span>1400</span>
              <span>1350</span>
              <span>1300</span>
            </div>
            <span className="chart-point" />
            <div className="chart-range"><i /><i /></div>
          </div>

          <aside className="profile-info-panel">
            <p>Дата регистрации {formatDate(session.user.created_at)}</p>
            <p>Был онлайн прямо сейчас</p>
            <p className="blue-info">Профиль заполнен на 0%</p>
            <p>Проведённое за игрой время: {getPlayTime(games)}</p>
            <button type="button" onClick={onSignOut} disabled={busy}>
              {busy ? '...' : signOutText[lang]}
            </button>
          </aside>
        </div>
      </div>
    </section>
  );
}

function RatingMode({ label, value, count }: { label: string; value?: number | string; count: number }) {
  return (
    <div className="rating-mode">
      <span className="mode-mark" />
      <div>
        <strong>{label}</strong>
        <p>{value ?? '?'} · {count} игр</p>
      </div>
    </div>
  );
}

function getDisplayName(session: Session): string {
  const metadata = session.user.user_metadata as Record<string, unknown>;
  return getText(metadata.username)
    || getText(metadata.preferred_username)
    || getText(metadata.name)
    || getText(metadata.full_name)
    || session.user.email
    || session.user.id;
}

function getText(value: unknown): string {
  return typeof value === 'string' && value ? value : '';
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

function getModeCounts(games: StoredGame[]) {
  return games.reduce(
    (counts, game) => ({ ...counts, [getMode(game.timeControl)]: counts[getMode(game.timeControl)] + 1 }),
    { bullet: 0, blitz: 0, rapid: 0, classical: 0 },
  );
}

function getMode(timeControl: string): 'bullet' | 'blitz' | 'rapid' | 'classical' {
  const seconds = Number(timeControl.split('+')[0]);
  if (!Number.isFinite(seconds)) return 'rapid';
  if (seconds < 180) return 'bullet';
  if (seconds < 480) return 'blitz';
  if (seconds < 1500) return 'rapid';
  return 'classical';
}

function getPlayTime(games: StoredGame[]): string {
  const minutes = Math.max(1, games.length * 2);
  return `${minutes} минут`;
}
