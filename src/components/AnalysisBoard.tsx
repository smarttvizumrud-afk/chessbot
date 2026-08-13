import { useEffect, useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import type { CustomPieces, Piece } from 'react-chessboard/dist/chessboard/types';
import type { PieceStyle } from '../lib/types';

type Props = {
  fen: string;
  pieceStyle: PieceStyle;
};

const pieces: Piece[] = ['wP', 'wB', 'wN', 'wR', 'wQ', 'wK', 'bP', 'bB', 'bN', 'bR', 'bQ', 'bK'];

const glyphs: Record<Piece, string> = {
  wP: '\u2659',
  wB: '\u2657',
  wN: '\u2658',
  wR: '\u2656',
  wQ: '\u2655',
  wK: '\u2654',
  bP: '\u265f',
  bB: '\u265d',
  bN: '\u265e',
  bR: '\u265c',
  bQ: '\u265b',
  bK: '\u265a',
};

export function AnalysisBoard({ fen, pieceStyle }: Props) {
  const [boardFen, setBoardFen] = useState(fen);
  const customPieces = useMemo(() => getCustomPieces(pieceStyle), [pieceStyle]);

  useEffect(() => {
    setBoardFen(fen);
  }, [fen]);

  function dropPiece(sourceSquare: string, targetSquare: string) {
    const chess = new Chess(boardFen);
    const move = chess.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q',
    });
    if (!move) return false;
    setBoardFen(chess.fen());
    return true;
  }

  return (
    <Chessboard
      position={boardFen}
      boardWidth={Math.min(window.innerWidth - 40, 520)}
      customPieces={customPieces}
      onPieceDrop={dropPiece}
    />
  );
}

function getCustomPieces(pieceStyle: PieceStyle): CustomPieces | undefined {
  if (pieceStyle === 'classic') return undefined;

  const customPieces: CustomPieces = {};
  pieces.forEach((piece) => {
    customPieces[piece] = ({ squareWidth }) => (
      <span
        className={`piece-symbol piece-${piece[0] === 'w' ? 'white' : 'black'} piece-${pieceStyle}`}
        style={{ width: squareWidth, height: squareWidth, fontSize: squareWidth * 0.78 }}
      >
        {glyphs[piece]}
      </span>
    );
  });
  return customPieces;
}
