import type { MoveReport, StoredAnalysis, StoredGame } from './types';

export type EndgameMoment = {
  id: string;
  gameId: string;
  opponent: string;
  opening: string;
  moveNumber: number;
  played: string;
  bestMove: string;
  loss: number;
  label: MoveReport['label'];
  theme: string;
};

export function endgameMomentsFromGames(
  games: StoredGame[],
  analyses: StoredAnalysis[],
): EndgameMoment[] {
  const gamesById = new Map(games.map((game) => [game.id, game]));

  return analyses
    .flatMap((analysis) => {
      const game = gamesById.get(analysis.gameId);
      if (!game) return [];

      return analysis.moveReports
        .filter(isTrainableEndgameMove)
        .map((report) => ({
          id: `${analysis.id}-${report.ply}`,
          gameId: game.id,
          opponent: game.opponent,
          opening: game.opening,
          moveNumber: report.moveNumber,
          played: report.san,
          bestMove: report.bestMove,
          loss: Math.round(report.loss),
          label: report.label,
          theme: report.theme,
        }));
    })
    .sort((left, right) => right.loss - left.loss)
    .slice(0, 9);
}

function isTrainableEndgameMove(report: MoveReport) {
  return report.side === 'player' && report.phase === 'endgame' && report.label !== 'good';
}
