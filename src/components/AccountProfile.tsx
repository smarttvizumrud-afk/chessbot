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

type ModeIcon = 'bullet' | 'blitz' | 'rapid' | 'classic' | 'puzzles';

const signOutText: Record<Lang, string> = {
  ru: '\u0412\u044b\u0439\u0442\u0438',
  en: 'Sign out',
  kk: '\u0428\u044b\u0493\u0443',
};

const text = {
  bullet: '\u041f\u0423\u041b\u042f',
  blitz: '\u0411\u041b\u0418\u0426',
  rapid: '\u0420\u0410\u041f\u0418\u0414',
  classic: '\u041a\u041b\u0410\u0421\u0421\u0418\u041a\u0410',
  puzzles: '\u0417\u0410\u0414\u0410\u0427\u0418',
  games: '\u0438\u0433\u0440',
  puzzleUnit: '\u0437\u0430\u0434\u0430\u0447',
  edit: '\u2699 \u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u043f\u0440\u043e\u0444\u0438\u043b\u044c',
  watch: '\u25a3 \u041f\u0440\u043e\u0441\u043c\u043e\u0442\u0440',
  download: '\u2b07 \u0421\u043a\u0430\u0447\u0430\u0442\u044c \u0438\u0433\u0440\u044b',
  more: '\u0415\u0449\u0451 \u25be',
  created: '\u0414\u0430\u0442\u0430 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438',
  online: '\u0411\u044b\u043b \u043e\u043d\u043b\u0430\u0439\u043d \u043f\u0440\u044f\u043c\u043e \u0441\u0435\u0439\u0447\u0430\u0441',
  filled: '\u041f\u0440\u043e\u0444\u0438\u043b\u044c \u0437\u0430\u043f\u043e\u043b\u043d\u0435\u043d \u043d\u0430 0%',
  playTime: '\u041f\u0440\u043e\u0432\u0435\u0434\u0451\u043d\u043d\u043e\u0435 \u0437\u0430 \u0438\u0433\u0440\u043e\u0439 \u0432\u0440\u0435\u043c\u044f',
};

export function AccountProfile({ session, profiles, games, busy, lang, onSignOut }: Props) {
  const profile = profiles[0];
  const username = profile?.username || getDisplayName(session);
  const counts = getModeCounts(games);

  return (
    <section className="lichess-profile">
      <aside className="profile-side">
        <RatingMode icon="bullet" label={text.bullet} value="?" count={counts.bullet} unit={text.games} />
        <RatingMode icon="blitz" label={text.blitz} value={profile?.blitz} count={counts.blitz} unit={text.games} />
        <RatingMode icon="rapid" label={text.rapid} value={profile?.rapid} count={counts.rapid} unit={text.games} />
        <RatingMode icon="classic" label={text.classic} value={profile?.classical} count={counts.classical} unit={text.games} />
        <div className="profile-side-line" />
        <RatingMode icon="puzzles" label={text.puzzles} value="?" count={0} unit={text.puzzleUnit} />
      </aside>

      <div className="profile-main">
        <header className="profile-hero-row">
          <span className="online-dot" />
          <h1>{username}</h1>
        </header>

        <div className="profile-actions-bar">
          <button type="button" className="profile-tool">{text.edit}</button>
          <Link href="/" className="profile-tool">{text.watch}</Link>
          <Link href="/" className="profile-tool">{text.download}</Link>
          <button type="button" className="profile-tool muted-tool">{text.more}</button>
        </div>

        <div className="profile-content-grid">
          <div className="profile-chart">
            <button type="button" className="all-filter">ALL</button>
            <div className="chart-lines"><span>1450</span><span>1400</span><span>1350</span><span>1300</span></div>
            <span className="chart-point" />
            <div className="chart-range"><i /><i /></div>
          </div>

          <aside className="profile-info-panel">
            <p>{text.created} {formatDate(session.user.created_at)}</p>
            <p>{text.online}</p>
            <p className="blue-info">{text.filled}</p>
            <p>{text.playTime}: {getPlayTime(games)}</p>
            <button type="button" onClick={onSignOut} disabled={busy}>
              {busy ? '...' : signOutText[lang]}
            </button>
          </aside>
        </div>
      </div>
    </section>
  );
}

function RatingMode({ icon, label, value, count, unit }: {
  icon: ModeIcon;
  label: string;
  value?: number | string;
  count: number;
  unit: string;
}) {
  return (
    <div className="rating-mode">
      <span className={`mode-mark mode-${icon}`} />
      <div>
        <strong>{label}</strong>
        <p>{value ?? '?'} {'\u00b7'} {count} {unit}</p>
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
  return `${minutes} \u043c\u0438\u043d\u0443\u0442`;
}
