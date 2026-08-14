import { useEffect, useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import type { BoardStyle, Lang, PieceStyle, StoredPuzzle } from '../lib/types';

type Props = {
  puzzle: StoredPuzzle;
  boardStyle: BoardStyle;
  pieceStyle: PieceStyle;
  lang: Lang;
};

const text: Record<Lang, { wrong: string; solved: string; retry: string; solution: string; difficulty: string }> = {
  ru: { wrong: 'Неверный ход. Попробуй ещё раз.', solved: 'Верно!', retry: 'Попробовать снова', solution: 'Решение', difficulty: 'Сложность' },
  en: { wrong: 'Wrong move. Try again.', solved: 'Correct!', retry: 'Try again', solution: 'Solution', difficulty: 'Difficulty' },
  kk: { wrong: 'Қате жүріс. Қайта көр.', solved: 'Дұрыс!', retry: 'Қайта көру', solution: 'Шешімі', difficulty: 'Қиындық' },
};

const boardStyles: Record<BoardStyle, { light: string; dark: string }> = {
  classic: { light: '#f0d9b5', dark: '#b58863' },
  blue: { light: '#d7e6f6', dark: '#6f93b8' },
  green: { light: '#e5efd4', dark: '#79a65a' },
};

export function PuzzleSolver({ puzzle, boardStyle, pieceStyle, lang }: Props) {
  const labels = text[lang];
  const [fen, setFen] = useState(puzzle.fen);
  const [message, setMessage] = useState('');
  const [solved, setSolved] = useState(false);
  const colors = boardStyles[boardStyle];
  const boardOrientation = puzzle.sideToMove;
  void pieceStyle;

  useEffect(() => {
    setFen(puzzle.fen);
    setMessage('');
    setSolved(false);
  }, [puzzle]);

  function dropPiece(sourceSquare: string, targetSquare: string) {
    if (solved) return false;
    const played = `${sourceSquare}${targetSquare}`;
    const expected = puzzle.solution[0] ?? puzzle.bestMove;
    if (played !== expected.slice(0, 4)) {
      setMessage(labels.wrong);
      return false;
    }

    const chess = new Chess(fen);
    const move = chess.move({ from: sourceSquare, to: targetSquare, promotion: expected[4] ?? 'q' });
    if (!move) return false;
    setFen(chess.fen());
    setSolved(true);
    setMessage(labels.solved);
    return true;
  }

  function reset() {
    setFen(puzzle.fen);
    setMessage('');
    setSolved(false);
  }

  return (
    <section className="analysis-layout">
      <div className="board-panel">
        <Chessboard
          position={fen}
          boardWidth={Math.min(window.innerWidth - 40, 520)}
          boardOrientation={boardOrientation}
          customLightSquareStyle={{ backgroundColor: colors.light }}
          customDarkSquareStyle={{ backgroundColor: colors.dark }}
          onPieceDrop={dropPiece}
        />
      </div>
      <article className="panel puzzle-panel">
        <span className="puzzle-badge">{puzzle.theme}</span>
        <h1>{labels.difficulty}: {puzzle.difficulty}/5</h1>
        <p>FEN: {puzzle.fen}</p>
        <p>{puzzle.explanation}</p>
        {message && <p className="message">{message}</p>}
        {solved && <p><strong>{labels.solution}:</strong> {puzzle.solution.join(' ')}</p>}
        <button type="button" onClick={reset}>{labels.retry}</button>
      </article>
    </section>
  );
}
