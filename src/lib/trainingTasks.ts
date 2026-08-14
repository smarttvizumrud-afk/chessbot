import { normalizeOpening } from './pgn';
import type { MoveReport, StoredAnalysis, StoredGame } from './types';

export type TrainingTask = {
  id: string;
  gameId: string;
  opening: string;
  opponent: string;
  report?: MoveReport;
};

export type TrainingSections = {
  blunders: TrainingTask[];
  games: TrainingTask[];
  openings: TrainingTask[];
};

const severity: Record<MoveReport['label'], number> = { good: 0, inaccuracy: 1, mistake: 2, blunder: 3 };

export function buildTrainingSections(games: StoredGame[], analyses: StoredAnalysis[]): TrainingSections {
  const byAnalysis = new Map(analyses.map((analysis) => [analysis.gameId, analysis]));
  const tasks = games.flatMap((game) => buildGameTasks(game, byAnalysis.get(game.id)));

  return {
    blunders: tasks
      .filter((task) => task.report?.label === 'blunder')
      .sort(byWorstMove)
      .slice(0, 6),
    games: games
      .map((game) => worstGameTask(game, byAnalysis.get(game.id)))
      .filter((task): task is TrainingTask => Boolean(task))
      .slice(0, 6),
    openings: buildOpeningTasks(games, tasks),
  };
}

function buildGameTasks(game: StoredGame, analysis?: StoredAnalysis): TrainingTask[] {
  if (!analysis) return [];
  return analysis.moveReports
    .filter((report) => report.side === 'player' && report.label !== 'good')
    .map((report) => ({
      id: `${analysis.id}-${report.ply}`,
      gameId: game.id,
      opening: normalizeOpening(game.opening, game.pgn),
      opponent: game.opponent,
      report,
    }));
}

function worstGameTask(game: StoredGame, analysis?: StoredAnalysis): TrainingTask | null {
  const [task] = buildGameTasks(game, analysis).sort(byWorstMove);
  return task ?? null;
}

function buildOpeningTasks(games: StoredGame[], tasks: TrainingTask[]): TrainingTask[] {
  const openingMistakes = tasks
    .filter((task) => task.report?.phase === 'opening')
    .sort(byWorstMove);
  const used = new Set(openingMistakes.map((task) => task.opening));
  const reviewTasks = topOpenings(games)
    .filter((task) => !used.has(task.opening))
    .slice(0, Math.max(0, 6 - openingMistakes.length));

  return [...openingMistakes, ...reviewTasks].slice(0, 6);
}

function topOpenings(games: StoredGame[]): TrainingTask[] {
  const groups = new Map<string, StoredGame[]>();
  games.forEach((game) => {
    const opening = normalizeOpening(game.opening, game.pgn);
    groups.set(opening, [...(groups.get(opening) ?? []), game]);
  });

  return [...groups.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([opening, openingGames]) => {
      const game = openingGames[0];
      return {
        id: `opening-${opening}`,
        gameId: game.id,
        opening,
        opponent: game.opponent,
      };
    });
}

function byWorstMove(a: TrainingTask, b: TrainingTask) {
  const first = a.report;
  const second = b.report;
  if (!first || !second) return Number(Boolean(second)) - Number(Boolean(first));
  return severity[second.label] - severity[first.label] || second.loss - first.loss;
}
