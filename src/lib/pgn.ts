import { Chess } from 'chess.js';

export function getPgnHeader(pgn: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = pgn.match(new RegExp(`\\[${escaped}\\s+"([^"]*)"\\]`));
  return match?.[1] ?? '';
}

export function getOpening(pgn: string) {
  const opening = cleanOpening(getPgnHeader(pgn, 'Opening'));
  if (opening) return opening;

  const ecoUrlOpening = openingFromEcoUrl(getPgnHeader(pgn, 'ECOUrl'));
  if (ecoUrlOpening) return ecoUrlOpening;

  const eco = getPgnHeader(pgn, 'ECO');
  return eco ? `ECO ${eco}` : 'Unknown opening';
}

export function normalizeOpening(opening: string, pgn = '') {
  if (!opening || opening === 'Unknown opening' || /^ECO\s?[A-E]\d\d$/i.test(opening)) {
    return getOpening(pgn);
  }
  return cleanOpening(opening) || getOpening(pgn);
}

export function getMovesWithFens(pgn: string) {
  const chess = new Chess();
  chess.loadPgn(pgn, { strict: false });
  const history = chess.history();
  const replay = new Chess();

  return history.map((san, index) => {
    const fenBefore = replay.fen();
    replay.move(san);
    return {
      san,
      fenBefore,
      ply: index + 1,
      moveNumber: Math.floor(index / 2) + 1,
    };
  });
}

export function fenAfterPly(pgn: string, ply: number) {
  const chess = new Chess();
  chess.loadPgn(pgn, { strict: false });
  const moves = chess.history();
  const replay = new Chess();
  moves.slice(0, ply).forEach((move) => replay.move(move));
  return replay.fen();
}

export function phaseForPly(ply: number) {
  if (ply <= 16) return 'opening';
  if (ply <= 60) return 'middlegame';
  return 'endgame';
}

function openingFromEcoUrl(url: string) {
  if (!url) return '';
  const slug = decodeURIComponent(url)
    .split('/openings/')[1]
    ?.split(/[?#]/)[0]
    ?.replace(/\/$/, '');
  if (!slug) return '';

  const words = slug
    .split('-')
    .filter((word) => !isMoveToken(word))
    .map((word) => word.replace(/\+/g, ' '));

  return cleanOpening(words.join(' '));
}

function cleanOpening(value: string) {
  return value
    .replace(/\s+/g, ' ')
    .replace(/\bDefence\b/g, 'Defense')
    .replace(/\b[A-E]\d\d\b$/, '')
    .trim();
}

function isMoveToken(word: string) {
  return /^\d+$/.test(word) || /^[a-h][1-8]$/i.test(word) || /^[nbrqk]?[a-h]?[1-8]?x?[a-h][1-8][+#]?$/i.test(word);
}
