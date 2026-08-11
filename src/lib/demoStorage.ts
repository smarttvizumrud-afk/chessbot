import type { GameAnalysis, ImportedGame, StoredAnalysis, StoredGame } from './types';

const demoGamesKey = 'chess-demo-games';
const demoAnalysesKey = 'chess-demo-analyses';

export function isDemoMode() {
  return window.localStorage.getItem('chess-demo-mode') === '1';
}

export function enableDemoMode() {
  window.localStorage.setItem('chess-demo-mode', '1');
  window.dispatchEvent(new Event('chess-demo-mode'));
}

export function loadDemoGames() {
  return readLocal<StoredGame>(demoGamesKey);
}

export function loadDemoAnalyses() {
  return readLocal<StoredAnalysis>(demoAnalysesKey);
}

export function saveDemoGame(game: ImportedGame) {
  const games = loadDemoGames();
  const existing = games.find(
    (item) => item.platform === game.platform && item.platformGameId === game.platformGameId,
  );
  if (existing) return existing;
  const stored: StoredGame = { ...game, id: crypto.randomUUID() };
  writeLocal(demoGamesKey, [stored, ...games]);
  return stored;
}

export function saveDemoAnalysis(gameId: string, analysis: GameAnalysis) {
  const analyses = loadDemoAnalyses();
  const stored: StoredAnalysis = { ...analysis, id: crypto.randomUUID(), gameId };
  const next = analyses.filter((item) => item.gameId !== gameId);
  writeLocal(demoAnalysesKey, [stored, ...next]);
  return stored;
}

function readLocal<T>(key: string) {
  const raw = window.localStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function writeLocal<T>(key: string, items: T[]) {
  window.localStorage.setItem(key, JSON.stringify(items));
}
