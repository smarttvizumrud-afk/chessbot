import type { ImportedGame, Platform } from './types';
import { getOpening } from './pgn';

type ChessComGame = {
  url: string;
  pgn?: string;
  end_time: number;
  time_control?: string;
  white: { username: string; result: string; rating?: number };
  black: { username: string; result: string; rating?: number };
};

type LichessGame = {
  id: string;
  pgn?: string;
  createdAt: number;
  players: {
    white?: { user?: { name?: string }; rating?: number };
    black?: { user?: { name?: string }; rating?: number };
  };
  winner?: 'white' | 'black';
  speed?: string;
  opening?: { name?: string };
};

export type ImportOptions = {
  platform: Platform;
  username: string;
  limit: number;
  since?: string;
  until?: string;
};

export async function fetchPlatformGames(options: ImportOptions) {
  return options.platform === 'chesscom'
    ? fetchChessComGames(options)
    : fetchLichessGames(options);
}

async function fetchChessComGames(options: ImportOptions) {
  const profileUrl = `https://api.chess.com/pub/player/${options.username}/games/archives`;
  const archives = await fetchJson<{ archives: string[] }>(profileUrl);
  const selected = archives.archives.slice(-6).reverse();
  const games: ImportedGame[] = [];

  for (const archive of selected) {
    const data = await fetchJson<{ games: ChessComGame[] }>(archive);
    games.push(...data.games.map((game) => mapChessComGame(game, options.username)));
    if (games.length >= options.limit * 2) break;
  }

  return filterAndLimit(games, options);
}

async function fetchLichessGames(options: ImportOptions) {
  const params = new URLSearchParams({
    max: String(Math.max(options.limit, 1)),
    pgnInJson: 'true',
    opening: 'true',
    moves: 'true',
  });
  if (options.since) params.set('since', String(new Date(options.since).getTime()));
  if (options.until) params.set('until', String(new Date(options.until).getTime()));

  const response = await fetch(`https://lichess.org/api/games/user/${options.username}?${params}`, {
    headers: { Accept: 'application/x-ndjson' },
  });
  if (!response.ok) throw new Error('Lichess did not return games for this user.');
  const rows = (await response.text()).trim().split('\n').filter(Boolean);
  return rows.map((row) => mapLichessGame(JSON.parse(row) as LichessGame, options.username));
}

function mapChessComGame(game: ChessComGame, username: string): ImportedGame {
  const isWhite = game.white.username.toLowerCase() === username.toLowerCase();
  const player = isWhite ? game.white : game.black;
  const opponent = isWhite ? game.black.username : game.white.username;
  return {
    platform: 'chesscom',
    platformGameId: game.url,
    username,
    opponent,
    playedAt: new Date(game.end_time * 1000).toISOString(),
    result: resultFrom(player.result),
    color: isWhite ? 'white' : 'black',
    playerRating: player.rating,
    opening: getOpening(game.pgn ?? ''),
    pgn: game.pgn ?? '',
    timeControl: game.time_control ?? 'unknown',
  };
}

function mapLichessGame(game: LichessGame, username: string): ImportedGame {
  const whiteName = game.players.white?.user?.name ?? 'Anonymous';
  const isWhite = whiteName.toLowerCase() === username.toLowerCase();
  const winner = game.winner;
  const player = isWhite ? game.players.white : game.players.black;
  return {
    platform: 'lichess',
    platformGameId: game.id,
    username,
    opponent: isWhite ? game.players.black?.user?.name ?? 'Anonymous' : whiteName,
    playedAt: new Date(game.createdAt).toISOString(),
    result: !winner ? 'draw' : winner === (isWhite ? 'white' : 'black') ? 'win' : 'loss',
    color: isWhite ? 'white' : 'black',
    playerRating: player?.rating,
    opening: game.opening?.name ?? getOpening(game.pgn ?? ''),
    pgn: game.pgn ?? '',
    timeControl: game.speed ?? 'unknown',
  };
}

async function fetchJson<T>(url: string) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('Chess platform request failed.');
  return (await response.json()) as T;
}

function resultFrom(result: string) {
  if (result === 'win') return 'win';
  if (result === 'agreed' || result === 'repetition' || result === 'stalemate') return 'draw';
  if (result === '50move' || result === 'insufficient') return 'draw';
  return 'loss';
}

function filterAndLimit(games: ImportedGame[], options: ImportOptions) {
  const since = options.since ? new Date(options.since).getTime() : 0;
  const until = options.until ? new Date(options.until).getTime() : Number.POSITIVE_INFINITY;
  return games
    .filter((game) => game.pgn && new Date(game.playedAt).getTime() >= since)
    .filter((game) => new Date(game.playedAt).getTime() <= until)
    .sort((a, b) => Date.parse(b.playedAt) - Date.parse(a.playedAt))
    .slice(0, options.limit);
}
