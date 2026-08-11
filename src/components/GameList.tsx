import { Link } from 'wouter';
import type { StoredAnalysis, StoredGame } from '../lib/types';

type Props = { games: StoredGame[]; analyses: StoredAnalysis[] };

export function GameList({ games, analyses }: Props) {
  const byGame = new Map(analyses.map((analysis) => [analysis.gameId, analysis]));

  return (
    <section className="panel">
      <h2>Recent analysed games</h2>
      <div className="game-list">
        {games.slice(0, 8).map((game) => {
          const analysis = byGame.get(game.id);
          return (
            <Link href={`/game/${game.id}`} className="game-row" key={game.id}>
              <span>{game.username} vs {game.opponent}</span>
              <b>{analysis ? `${analysis.accuracy}%` : 'new'}</b>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
