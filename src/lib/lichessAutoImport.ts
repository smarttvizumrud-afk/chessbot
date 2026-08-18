import type { Session } from '@supabase/supabase-js';
import { analyzeGame } from './analyzer';
import { fetchPlatformGames, fetchPlatformRatings } from './platforms';
import { generatePuzzleForGame } from './puzzleGenerator';
import { savePuzzleGenerationResult } from './puzzles';
import { saveAnalysis, saveGame, saveProfile } from './storage';
import { StockfishClient } from './stockfish';

type AutoImportProgress = (message: string) => void;

type LichessAccount = {
  id?: string;
  username?: string;
};

const AUTO_IMPORT_LIMIT = 100;

export async function autoImportLichessGames(session: Session, onProgress?: AutoImportProgress) {
  if (!isLichessSession(session)) return { imported: 0, analysed: 0, skipped: true };

  const username = await resolveLichessUsername(session);
  if (!username) return { imported: 0, analysed: 0, skipped: true };

  const engine = new StockfishClient();
  try {
    onProgress?.(`Lichess: загружаю профиль ${username}...`);
    await saveProfile(await fetchPlatformRatings('lichess', username));

    onProgress?.(`Lichess: загружаю последние ${AUTO_IMPORT_LIMIT} партий...`);
    const games = await fetchPlatformGames({ platform: 'lichess', username, limit: AUTO_IMPORT_LIMIT });
    let analysed = 0;

    for (const [index, game] of games.entries()) {
      onProgress?.(`Lichess: анализирую ${index + 1}/${games.length}...`);
      const stored = await saveGame(game);
      const analysis = await analyzeGame(game, engine);
      const storedAnalysis = await saveAnalysis(stored.id, analysis);
      await savePuzzleGenerationResult(generatePuzzleForGame(stored, storedAnalysis));
      analysed += 1;
    }

    return { imported: games.length, analysed, skipped: false };
  } finally {
    engine.stop();
  }
}

function isLichessSession(session: Session) {
  const appMetadata = toRecord(session.user.app_metadata);
  const provider = stringValue(appMetadata.provider);
  if (provider.includes('lichess')) return true;

  const providers = appMetadata.providers;
  if (Array.isArray(providers) && providers.some((item) => stringValue(item).includes('lichess'))) return true;

  return session.user.identities?.some((identity) => identity.provider.includes('lichess')) ?? false;
}

async function resolveLichessUsername(session: Session) {
  const tokenUsername = await usernameFromProviderToken(session.provider_token);
  if (tokenUsername) return tokenUsername;

  const metadata = toRecord(session.user.user_metadata);
  return [
    metadata.preferred_username,
    metadata.user_name,
    metadata.username,
    metadata.nickname,
    metadata.name,
    metadata.sub,
    metadata.provider_id,
  ].map(stringValue).find(Boolean) ?? '';
}

async function usernameFromProviderToken(token?: string | null) {
  if (!token) return '';
  try {
    const response = await fetch('https://lichess.org/api/account', {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) return '';
    const account = (await response.json()) as LichessAccount;
    return account.username ?? account.id ?? '';
  } catch {
    return '';
  }
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : '';
}
