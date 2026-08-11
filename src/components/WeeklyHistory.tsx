import { Link } from 'wouter';
import { useState } from 'react';
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
  const [query, setQuery] = useState('');
  const byGame = new Map(games.map((game) => [game.id, game]));
  const closed = new Set(loadClosedAnalyses());
  const weekAgo = Date.now() - 7 * 86_400_000;
  const normalizedQuery = query.trim().toLowerCase();
  const rows = analyses
    .filter((analysis) => !closed.has(analysis.id))
    .filter((analysis) => {
      const game = byGame.get(analysis.gameId);
      if (!game) return false;
      if (!normalizedQuery) return Date.parse(analysis.createdAt) >= weekAgo;
      return [game.username, game.opponent].some((name) => name.toLowerCase().includes(normalizedQuery));
    })
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const emptyText = normalizedQuery ? t(lang, 'noSearchHistory') : t(lang, 'noWeeklyHistory');

  return (
    <section className="panel">
      <h2>{t(lang, 'weeklyHistory')}</h2>
      <input
        className="history-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t(lang, 'searchPlayerHistory')}
      />
      {!rows.length && <p>{emptyText}</p>}
      <div className="game-list">
        {rows.map((analysis) => {
          const game = byGame.get(analysis.gameId);
          if (!game) return null;
          return (
            <div className="game-row" key={analysis.id}>
              <Link href={`/game/${game.id}`} className="game-link">
                <span>{game.username} {t(lang, 'versus')} {game.opponent}</span>
                <small>
                  {t(lang, 'playedAt')} {formatDate(game.playedAt)} · {t(lang, 'analysedAt')} {formatDate(analysis.createdAt)}
                </small>
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
