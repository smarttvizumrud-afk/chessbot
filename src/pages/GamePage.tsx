import { useEffect, useMemo, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { AuthGate } from '../components/AuthGate';
import { fenAfterPly, getMovesWithFens } from '../lib/pgn';
import type { Lang } from '../lib/types';
import { useChessData } from '../lib/useChessData';

export function GamePage({ id, lang }: { id: string; lang: Lang }) {
  return (
    <AuthGate>
      <GameContent id={id} lang={lang} />
    </AuthGate>
  );
}

function GameContent({ id, lang }: { id: string; lang: Lang }) {
  const { games, analyses, loading } = useChessData();
  const game = games.find((item) => item.id === id);
  const analysis = analyses.find((item) => item.gameId === id);
  const [ply, setPly] = useState(0);
  const report = analysis?.moveReports.find((item) => item.ply === ply);
  const totalPly = useMemo(() => game ? getMovesWithFens(game.pgn).length : 0, [game]);
  const fen = useMemo(() => game ? fenAfterPly(game.pgn, ply) : '', [game, ply]);
  const title = lang === 'en' ? 'Game analysis' : lang === 'kk' ? 'Партия талдауы' : 'Анализ партии';

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      setPly((currentPly) => {
        if (event.key === 'ArrowLeft') return Math.max(currentPly - 1, 0);
        return Math.min(currentPly + 1, totalPly);
      });
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalPly]);

  if (loading) return <section className="panel">Loading...</section>;
  if (!game || !analysis || !fen) return <section className="panel">Game analysis not found.</section>;

  return (
    <div className="analysis-layout">
      <section className="board-panel">
        <Chessboard position={fen} boardWidth={Math.min(window.innerWidth - 40, 520)} />
      </section>
      <section className="panel">
        <h1>{title}</h1>
        <p>{game.color} vs {game.opponent} · {analysis.accuracy}% accuracy</p>
        <div className="moves">
          {analysis.moveReports.map((item) => (
            <button className={item.label} key={item.ply} onClick={() => setPly(item.ply)}>
              {item.moveNumber}. {item.san}
            </button>
          ))}
        </div>
        {report && (
          <article className="critical">
            <b>{report.label}: {report.theme}</b>
            <p>Your move: {report.san}. Stockfish best: {report.bestMove}.</p>
            <p>Eval changed by {Math.round(report.loss)} cp. {report.explanation}</p>
          </article>
        )}
      </section>
    </div>
  );
}
