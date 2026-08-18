import { useEffect, useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import type { CustomPieces, Piece } from 'react-chessboard/dist/chessboard/types';
import type { BoardStyle, PieceStyle } from '../lib/types';
import { usePositionEvaluation } from '../lib/usePositionEvaluation';
import { useResponsiveBoardWidth } from '../lib/useResponsiveBoardWidth';

type Props = {
  fen: string;
  boardStyle: BoardStyle;
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

export function AnalysisBoard({ fen, boardStyle, pieceStyle }: Props) {
  const [boardFen, setBoardFen] = useState(fen);
  const customPieces = useMemo(() => getCustomPieces(pieceStyle), [pieceStyle]);
  const boardColors = boardStyles[boardStyle];
  const { boardWrapRef, boardWidth } = useResponsiveBoardWidth();
  const evaluation = usePositionEvaluation(boardFen);

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
    <div className="board-wrap" ref={boardWrapRef}>
      <Chessboard
        position={boardFen}
        boardWidth={boardWidth}
        customPieces={customPieces}
        customLightSquareStyle={{ backgroundColor: boardColors.light }}
        customDarkSquareStyle={{ backgroundColor: boardColors.dark }}
        onPieceDrop={dropPiece}
      />
      <div className="eval-chip">
        <span>Оценка позиции</span>
        <strong>{evaluation.loading ? '...' : evaluation.label}</strong>
      </div>
    </div>
  );
}

const boardStyles: Record<BoardStyle, { light: string; dark: string }> = {
  classic: { light: '#f0d9b5', dark: '#b58863' },
  blue: { light: '#d7e6f6', dark: '#6f93b8' },
  green: { light: '#e5efd4', dark: '#79a65a' },
};

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
