import { Chess } from 'chess.js';

export function getPgnHeader(pgn: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = pgn.match(new RegExp(`\\[${escaped}\\s+"([^"]*)"\\]`));
  return match?.[1] ?? '';
}

export function getOpening(pgn: string) {
  return getPgnHeader(pgn, 'Opening') || getPgnHeader(pgn, 'ECO') || 'Unknown opening';
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
