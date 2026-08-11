import { Chess } from 'chess.js';
import { getMovesWithFens, phaseForPly } from './pgn';
import { StockfishClient } from './stockfish';
import type { GameAnalysis, ImportedGame, MoveReport, PlayerColor } from './types';

const MAX_ANALYZED_PLAYER_MOVES = 18;

export async function analyzeGame(game: ImportedGame, engine: StockfishClient): Promise<GameAnalysis> {
  const moves = getMovesWithFens(game.pgn);
  const playerParity = game.color === 'white' ? 1 : 0;
  const playerMoves = moves.filter((move) => move.ply % 2 === playerParity);
  const sampled = playerMoves.slice(0, MAX_ANALYZED_PLAYER_MOVES);
  const reports: MoveReport[] = [];

  for (const move of sampled) {
    const before = await engine.evaluate(move.fenBefore);
    const afterFen = fenAfterPlayedMove(move.fenBefore, move.san);
    const after = await engine.evaluate(afterFen);
    const report = toMoveReport(move, before, after.score, game.color);
    reports.push(report);
  }

  return summarizeReports(reports, game);
}

function fenAfterPlayedMove(fen: string, san: string) {
  const chess = new Chess(fen);
  chess.move(san);
  return chess.fen();
}

function toMoveReport(
  move: { san: string; fenBefore: string; ply: number; moveNumber: number },
  best: { bestMove: string; score: number },
  playedScore: number,
  color: PlayerColor,
): MoveReport {
  const perspective = color === 'white' ? 1 : -1;
  const bestEval = best.score * perspective;
  const playedEval = -playedScore * perspective;
  const loss = Math.max(0, bestEval - playedEval);
  const label = labelForLoss(loss);
  const phase = phaseForPly(move.ply);
  const theme = themeFor(move.san, phase, loss);

  return {
    ply: move.ply,
    moveNumber: move.moveNumber,
    san: move.san,
    fenBefore: move.fenBefore,
    playedEval,
    bestMove: best.bestMove,
    bestEval,
    loss,
    label,
    phase,
    theme,
    explanation: explain(label, theme, loss, best.bestMove),
  };
}

function labelForLoss(loss: number): MoveReport['label'] {
  if (loss >= 300) return 'blunder';
  if (loss >= 150) return 'mistake';
  if (loss >= 70) return 'inaccuracy';
  return 'good';
}

function themeFor(san: string, phase: MoveReport['phase'], loss: number) {
  if (loss < 70) return 'clean play';
  if (san.includes('x')) return 'tactical contact';
  if (san.includes('+')) return 'forcing moves';
  if (phase === 'opening') return 'opening plans';
  if (phase === 'endgame') return 'endgame technique';
  return 'tactical vision';
}

function explain(label: MoveReport['label'], theme: string, loss: number, bestMove: string) {
  if (label === 'good') return 'The move kept the position close to the engine recommendation.';
  return `This ${label} lost about ${Math.round(loss)} centipawns. Stockfish preferred ${bestMove}, so the key theme is ${theme}.`;
}

function summarizeReports(reports: MoveReport[], game: ImportedGame): GameAnalysis {
  const critical = reports.filter((report) => report.label !== 'good');
  const inaccuracies = critical.filter((report) => report.label === 'inaccuracy').length;
  const mistakes = critical.filter((report) => report.label === 'mistake').length;
  const blunders = critical.filter((report) => report.label === 'blunder').length;
  const averageLoss = reports.reduce((sum, report) => sum + report.loss, 0) / Math.max(reports.length, 1);
  const weakSpots = topValues(critical.map((report) => report.theme));
  const accuracy = Math.max(0, Math.round(100 - averageLoss / 8));

  return {
    accuracy,
    inaccuracies,
    mistakes,
    blunders,
    weakSpots,
    trainingPlan: buildPlan(weakSpots, game.opening),
    moveReports: reports,
    aiSummary: buildSummary(game, weakSpots, accuracy),
  };
}

function topValues(values: string[]) {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([value]) => value);
}

function buildPlan(weakSpots: string[], opening: string) {
  const base = weakSpots.length ? weakSpots : ['calculation discipline'];
  return base.map((spot, index) => {
    if (spot === 'opening plans') return `Study typical plans in ${opening}.`;
    if (spot === 'endgame technique') return 'Train practical rook and pawn endgames.';
    if (index === 0) return `Start with focused exercises on ${spot}.`;
    return `Add 15 minutes of ${spot} training after each analysed game.`;
  });
}

function buildSummary(game: ImportedGame, weakSpots: string[], accuracy: number) {
  const weakText = weakSpots.length ? weakSpots.join(', ') : 'no repeated tactical pattern yet';
  return `${game.username}'s accuracy was ${accuracy}%. Main signal: ${weakText}.`;
}
