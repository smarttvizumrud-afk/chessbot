import type { StoredAnalysis, StoredGame } from './types';
import { normalizeOpening } from './pgn';

export function dashboardStats(games: StoredGame[], analyses: StoredAnalysis[]) {
  const analysedIds = new Set(analyses.map((analysis) => analysis.gameId));
  const analysedGames = games.filter((game) => analysedIds.has(game.id));
  const accuracy = average(analyses.map((analysis) => analysis.accuracy));
  const weaknesses = topStrings(analyses.flatMap((analysis) => analysis.weakSpots));

  return {
    rating: latestRating(analysedGames),
    total: analysedGames.length,
    wins: analysedGames.filter((game) => game.result === 'win').length,
    losses: analysedGames.filter((game) => game.result === 'loss').length,
    draws: analysedGames.filter((game) => game.result === 'draw').length,
    accuracy,
    mistakes: sum(analyses.map((analysis) => analysis.mistakes)),
    blunders: sum(analyses.map((analysis) => analysis.blunders)),
    weaknesses,
  };
}

export function openingStats(games: StoredGame[], analyses: StoredAnalysis[]) {
  const byGame = new Map(analyses.map((analysis) => [analysis.gameId, analysis]));
  const groups = new Map<string, { games: StoredGame[]; accuracies: number[]; errors: number }>();

  games.forEach((game) => {
    const opening = normalizeOpening(game.opening, game.pgn);
    const group = groups.get(opening) ?? { games: [], accuracies: [], errors: 0 };
    const analysis = byGame.get(game.id);
    group.games.push(game);
    if (analysis) {
      group.accuracies.push(analysis.accuracy);
      group.errors += analysis.mistakes + analysis.blunders;
    }
    groups.set(opening, group);
  });

  return [...groups.entries()].map(([opening, group]) => ({
    opening,
    games: group.games.length,
    score: average(group.accuracies),
    errors: group.errors,
    recommendation: recommendation(opening, average(group.accuracies), group.errors),
  })).sort((a, b) => b.games - a.games);
}

export function combinedPlan(analyses: StoredAnalysis[]) {
  const plan = analyses.flatMap((analysis) => analysis.trainingPlan);
  return topStrings(plan).slice(0, 5);
}

function recommendation(opening: string, accuracy: number, errors: number) {
  if (errors >= 3) return `Review the first critical moment in ${opening}.`;
  if (accuracy && accuracy < 75) return `Learn two model games in ${opening}.`;
  return `Keep ${opening} as a stable part of the repertoire.`;
}

function topStrings(values: string[]) {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([value]) => value);
}

function average(values: number[]) {
  return values.length ? Math.round(sum(values) / values.length) : 0;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function latestRating(games: StoredGame[]) {
  return games.find((game) => typeof game.playerRating === 'number')?.playerRating ?? 0;
}
