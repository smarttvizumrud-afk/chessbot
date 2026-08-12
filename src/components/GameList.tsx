import { Link } from 'wouter';
import { t } from '../lib/i18n';
import type { Lang, StoredAnalysis, StoredGame } from '../lib/types';

type Props = {
  games: StoredGame[];
  analyses: StoredAnalysis[];
  closedAnalyses: string[];
  lang: Lang;
  onClose: (id: string) => void;
};

export function GameList({ games, analyses, closedAnalyses, lang, onClose }: Props) {
  const byGame = new Map(analyses.map((analysis) => [analysis.gameId, analysis]));
  const closed = new Set(closedAnalyses);
  const visibleGames = games.filter((game) => !closed.has(byGame.get(game.id)?.id ?? ''));

  return (
    <section className="panel">
      <h2>{t(lang, 'recentGames')}</h2>
      <div className="game-list">
        {visibleGames.slice(0, 8).map((game) => {
          const analysis = byGame.get(game.id);
          return (
            <div className="game-row" key={game.id}>
              <Link href={`/game/${game.id}`} className="game-link">
                <span>{game.username} {t(lang, 'versus')} {game.opponent}</span>
                <b>{analysis ? `${analysis.accuracy}%` : t(lang, 'newGame')}</b>
              </Link>
              {analysis && <CloseButton id={analysis.id} lang={lang} onClose={onClose} />}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function CloseButton({ id, lang, onClose }: { id: string; lang: Lang; onClose: (id: string) => void }) {
  return (
    <button
      className="close-button"
      type="button"
      aria-label={t(lang, 'closeAnalysis')}
      onClick={() => onClose(id)}
    >
      x
    </button>
  );
}
