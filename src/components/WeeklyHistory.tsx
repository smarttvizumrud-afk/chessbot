import { Link } from 'wouter';
import { CloseButton } from './GameList';
import { loadClosedAnalyses } from '../lib/closedAnalyses';
import { t } from '../lib/i18n';
import type { Lang, StoredAnalysis, StoredGame } from '../lib/types';

type Props = {
  games: StoredGame[];
  analyses: StoredAnalysis[];
  lang: Lang;
  onClose: () => void;
};

export function WeeklyHistory({ games, analyses, lang, onClose }: Props) {
  const byGame = new Map(games.map((game) => [game.id, game]));
  const closed = new Set(loadClosedAnalyses());
  const weekAgo = Date.now() - 7 * 86_400_000;
  const weekly = analyses
    .filter((analysis) => Date.parse(analysis.createdAt) >= weekAgo)
    .filter((analysis) => !closed.has(analysis.id))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  return (
    <section className="panel">
      <h2>{t(lang, 'weeklyHistory')}</h2>
      {!weekly.length && <p>{t(lang, 'noWeeklyHistory')}</p>}
      <div className="game-list">
        {weekly.map((analysis) => {
          const game = byGame.get(analysis.gameId);
          if (!game) return null;
          return (
            <div className="game-row" key={analysis.id}>
              <Link href={`/game/${game.id}`} className="game-link">
                <span>{game.username} {t(lang, 'versus')} {game.opponent}</span>
                <small>{t(lang, 'analysedAt')} {formatDate(analysis.createdAt)}</small>
                <b>{analysis.accuracy}%</b>
              </Link>
              <CloseButton id={analysis.id} lang={lang} onClose={onClose} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { day: '2-digit', month: '2-digit' }).format(new Date(value));
}
