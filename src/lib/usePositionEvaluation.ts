import { useEffect, useState } from 'react';
import { StockfishClient } from './stockfish';

type EvaluationState = {
  label: string;
  loading: boolean;
};

export function usePositionEvaluation(fen: string): EvaluationState {
  const [state, setState] = useState<EvaluationState>({ label: '...', loading: true });

  useEffect(() => {
    let active = true;
    const engine = new StockfishClient();
    setState({ label: '...', loading: true });

    engine.evaluate(fen, 8)
      .then((line) => {
        if (!active) return;
        setState({ label: formatEvaluation(fen, line.score), loading: false });
      })
      .catch(() => {
        if (!active) return;
        setState({ label: '-', loading: false });
      });

    return () => {
      active = false;
      engine.stop();
    };
  }, [fen]);

  return state;
}

function formatEvaluation(fen: string, score: number) {
  if (Math.abs(score) >= 900) {
    const mateScore = Math.max(1, Math.round(Math.abs(score) / 1000));
    const whiteMate = whitePerspectiveScore(fen, score) > 0;
    return `${whiteMate ? '+' : '-'}M${mateScore}`;
  }

  const pawns = whitePerspectiveScore(fen, score) / 100;
  return `${pawns >= 0 ? '+' : ''}${pawns.toFixed(1)}`;
}

function whitePerspectiveScore(fen: string, score: number) {
  const activeColor = fen.split(' ')[1];
  return activeColor === 'b' ? -score : score;
}
