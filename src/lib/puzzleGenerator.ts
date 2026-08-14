import { Chess } from 'chess.js';
import type { MoveReport, StoredAnalysis, StoredGame, StoredPuzzle } from './types';

export type PuzzleCandidate = Omit<StoredPuzzle, 'id' | 'createdAt'>;
export type PuzzleEngine = 'stockfish' | 'caissa';

const MIN_PUZZLE_LOSS = 120;
const MAX_PUZZLES_PER_GAME = 4;

export function generatePuzzlesForGame(
  game: StoredGame,
  analysis: StoredAnalysis,
  engine: PuzzleEngine = 'stockfish',
): PuzzleCandidate[] {
  if (engine !== 'stockfish') {
    console.warn('Puzzle engine is not available yet, falling back to Stockfish reports.', engine);
  }

  return analysis.moveReports
    .filter(isUsefulPlayerPosition)
    .sort((a, b) => b.loss - a.loss)
    .map((report) => toPuzzle(game, analysis, report))
    .filter((puzzle): puzzle is PuzzleCandidate => Boolean(puzzle))
    .slice(0, MAX_PUZZLES_PER_GAME);
}

export function generatePuzzlesFromAnalyses(games: StoredGame[], analyses: StoredAnalysis[]) {
  const byGame = new Map(games.map((game) => [game.id, game]));
  return analyses.flatMap((analysis) => {
    const game = byGame.get(analysis.gameId);
    return game ? generatePuzzlesForGame(game, analysis) : [];
  });
}

function isUsefulPlayerPosition(report: MoveReport) {
  return report.side === 'player'
    && report.label !== 'good'
    && report.loss >= MIN_PUZZLE_LOSS
    && Boolean(report.bestMove);
}

function toPuzzle(game: StoredGame, analysis: StoredAnalysis, report: MoveReport): PuzzleCandidate | null {
  const bestMove = normalizeUci(report.bestMove);
  if (!bestMove || !isLegalUci(report.fenBefore, bestMove)) return null;

  return {
    gameId: game.id,
    analysisId: analysis.id,
    fen: report.fenBefore,
    bestMove,
    solution: [bestMove],
    sideToMove: sideToMove(report.fenBefore),
    theme: puzzleTheme(report),
    difficulty: difficultyFor(game.playerRating, report.loss, report.label),
    rating: ratingFor(game.playerRating, report.loss, report.label),
    sourcePly: report.ply,
    sourceMove: report.san,
    explanation: report.explanation,
  };
}

function normalizeUci(move: string) {
  const trimmed = move.trim();
  return /^[a-h][1-8][a-h][1-8][nbrq]?$/i.test(trimmed) ? trimmed.toLowerCase() : '';
}

function isLegalUci(fen: string, move: string) {
  try {
    const chess = new Chess(fen);
    return Boolean(chess.move({ from: move.slice(0, 2), to: move.slice(2, 4), promotion: move[4] ?? 'q' }));
  } catch {
    console.warn('Puzzle generator rejected an invalid position.', { fen, move });
    return false;
  }
}

function sideToMove(fen: string) {
  return fen.split(' ')[1] === 'b' ? 'black' : 'white';
}

function puzzleTheme(report: MoveReport) {
  if (report.bestMove.endsWith('#')) return 'mate attack';
  if (report.theme === 'tactical contact') return 'win material';
  if (report.theme === 'forcing moves') return 'combination';
  if (report.phase === 'opening') return 'opening tactic';
  return report.theme;
}

function difficultyFor(rating = 1200, loss: number, label: MoveReport['label']) {
  const ratingLevel = rating >= 2000 ? 2 : rating >= 1600 ? 1 : 0;
  const lossLevel = loss >= 500 ? 2 : loss >= 250 ? 1 : 0;
  const labelLevel = label === 'blunder' ? 1 : 0;
  return Math.min(5, Math.max(1, 1 + ratingLevel + lossLevel + labelLevel));
}

function ratingFor(playerRating = 1200, loss: number, label: MoveReport['label']) {
  const lossBonus = Math.min(500, Math.round(loss / 2));
  const labelBonus = label === 'blunder' ? 150 : label === 'mistake' ? 80 : 0;
  const base = Math.max(700, playerRating - 250);
  return Math.min(2600, Math.max(600, Math.round((base + lossBonus + labelBonus) / 50) * 50));
}
