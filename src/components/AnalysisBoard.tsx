import { useEffect, useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

type Props = {
  fen: string;
};

export function AnalysisBoard({ fen }: Props) {
  const [boardFen, setBoardFen] = useState(fen);

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
      onPieceDrop={dropPiece}
    />
  );
}
