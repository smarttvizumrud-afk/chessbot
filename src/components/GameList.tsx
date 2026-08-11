import { Link } from 'wouter';
import { t } from '../lib/i18n';
import type { Lang, StoredAnalysis, StoredGame } from '../lib/types';

type Props = { games: StoredGame[]; analyses: StoredAnalysis[]; lang: Lang };

export function GameList({ games, analyses, lang }: Props) {
  const byGame = new Map(analyses.map((analysis) => [analysis.gameId, analysis]));

  return (
    <section className="panel">
      <h2>{t(lang, 'recentGames')}</h2>
      <div className="game-list">
        {games.slice(0, 8).map((game) => {
          const analysis = byGame.get(game.id);
          return (
            <Link href={`/game/${game.id}`} className="game-row" key={game.id}>
              <span>{game.username} {t(lang, 'versus')} {game.opponent}</span>
              <b>{analysis ? `${analysis.accuracy}%` : t(lang, 'newGame')}</b>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
