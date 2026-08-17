import { useEffect, useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { saveOpeningAttempt, type OpeningProgress } from '../lib/openingProgress';
import type { OpeningVariant } from '../lib/openingVariants';
import type { BoardStyle, Lang, PieceStyle } from '../lib/types';
import { useResponsiveBoardWidth } from '../lib/useResponsiveBoardWidth';

type Props = {
  variant: OpeningVariant;
  progress?: OpeningProgress;
  boardStyle: BoardStyle;
  pieceStyle: PieceStyle;
  lang: Lang;
  onProgress: (progress: OpeningProgress) => void;
};

type WrongMove = { played: string; expected: string; ply: number };

const boardStyles: Record<BoardStyle, { light: string; dark: string }> = {
  classic: { light: '#f0d9b5', dark: '#b58863' },
  blue: { light: '#d7e6f6', dark: '#6f93b8' },
  green: { light: '#e5efd4', dark: '#79a65a' },
};

export function OpeningVariantTrainer({ variant, progress, boardStyle, pieceStyle, lang, onProgress }: Props) {
  const labels = text[lang];
  const colors = boardStyles[boardStyle];
  const { boardWrapRef, boardWidth } = useResponsiveBoardWidth();
  const [chess, setChess] = useState(() => new Chess());
  const [lineIndex, setLineIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [attemptDone, setAttemptDone] = useState(false);
  const [attemptFailed, setAttemptFailed] = useState(false);
  const [wrongMoves, setWrongMoves] = useState<WrongMove[]>([]);
  const [message, setMessage] = useState('');
  const successfulAttempts = progress?.successfulAttempts ?? 0;
  const errorCount = progress?.errorCount ?? 0;
  void pieceStyle;

  const userMoveCount = useMemo(
    () => variant.moves.filter((move) => move.side === variant.userSide).length,
    [variant],
  );

  useEffect(() => {
    resetBoard(false);
  }, [variant.id]);

  function startTraining() {
    resetBoard(true);
    playBotMoves(new Chess(), 0);
  }

  function dropPiece(sourceSquare: string, targetSquare: string) {
    if (!started || attemptDone || attemptFailed) return false;
    const expected = variant.moves[lineIndex];
    if (!expected || expected.side !== variant.userSide) return false;

    const nextChess = new Chess(chess.fen());
    const move = nextChess.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
    if (!move) return false;

    if (move.san !== expected.san) {
      const wrongMove = { played: move.san, expected: expected.san, ply: lineIndex + 1 };
      setWrongMoves((items) => [...items, wrongMove]);
      setAttemptFailed(true);
      setAttemptDone(true);
      setMessage(`${labels.wrongMove}: ${move.san}. ${labels.correctMove}: ${expected.san}.`);
      void finishAttempt(false, [wrongMove]);
      return false;
    }

    const nextIndex = lineIndex + 1;
    setChess(nextChess);
    setLineIndex(nextIndex);
    setMessage('');
    playBotMoves(nextChess, nextIndex);
    return true;
  }

  function playBotMoves(position: Chess, index: number) {
    let nextIndex = index;
    const nextChess = new Chess(position.fen());
    while (variant.moves[nextIndex]?.side !== variant.userSide && variant.moves[nextIndex]) {
      nextChess.move(variant.moves[nextIndex].san);
      nextIndex += 1;
    }

    setChess(nextChess);
    setLineIndex(nextIndex);
    if (nextIndex >= variant.moves.length) {
      setAttemptDone(true);
      setMessage(labels.success);
      void finishAttempt(true, wrongMoves);
    }
  }

  async function finishAttempt(success: boolean, mistakes: WrongMove[]) {
    const nextSuccesses = Math.min(3, successfulAttempts + (success ? 1 : 0));
    const nextErrors = errorCount + mistakes.length;
    const saved = await saveOpeningAttempt({
      opening: variant.opening,
      variant: variant.variant,
      successfulAttempts: nextSuccesses,
      errorCount: nextErrors,
    });
    onProgress(saved);
  }

  function resetBoard(shouldStart: boolean) {
    const nextChess = variant.startFen === 'start' ? new Chess() : new Chess(variant.startFen);
    setChess(nextChess);
    setLineIndex(0);
    setStarted(shouldStart);
    setAttemptDone(false);
    setAttemptFailed(false);
    setWrongMoves([]);
    setMessage(shouldStart ? labels.playLine : '');
  }

  const completed = successfulAttempts >= 3 || progress?.status === 'completed';

  return (
    <section className="opening-trainer">
      <article className="opening-study-card">
        <span className="puzzle-badge">{completed ? labels.completed : labels.training}</span>
        <h2>{variant.opening}</h2>
        <h3>{variant.variant}</h3>
        <p>{labels.sequence}: {variant.moves.map((move) => move.san).join(' ')}</p>
        <p>{labels.progress}: {Math.min(successfulAttempts + 1, 3)}/3</p>
        <p>{labels.successful}: {successfulAttempts}/3 · {labels.errors}: {errorCount}</p>
        {!started && <button type="button" onClick={startTraining} disabled={completed}>{labels.start}</button>}
      </article>

      <article className="opening-board-panel">
        <div className="board-wrap" ref={boardWrapRef}>
          <Chessboard
            position={chess.fen()}
            boardWidth={boardWidth}
            boardOrientation={variant.userSide}
            customLightSquareStyle={{ backgroundColor: colors.light }}
            customDarkSquareStyle={{ backgroundColor: colors.dark }}
            onPieceDrop={dropPiece}
          />
        </div>
      </article>

      <article className="opening-study-card">
        <h2>{labels.attempt} {Math.min(successfulAttempts + 1, 3)}/3</h2>
        <p>{labels.userMoves}: {userMoveCount}</p>
        {message && <p className="message">{message}</p>}
        {attemptDone && (
          <div className="opening-result">
            <strong>{attemptFailed ? labels.failed : labels.success}</strong>
            {wrongMoves.map((move) => (
              <p key={`${move.ply}-${move.played}`}>{labels.move} {move.ply}: {move.played} → {move.expected}</p>
            ))}
            {!completed && <button type="button" onClick={() => resetBoard(true)}>{labels.nextAttempt}</button>}
          </div>
        )}
      </article>
    </section>
  );
}

const text: Record<Lang, Record<string, string>> = {
  ru: {
    training: 'Тренировка',
    completed: 'Изучено',
    sequence: 'Последовательность',
    progress: 'Попытка',
    successful: 'Успешно',
    errors: 'Ошибки',
    start: 'Начать тренировку',
    playLine: 'Играй вариант по памяти. Бот ответит ходами линии.',
    wrongMove: 'Неправильный ход',
    correctMove: 'Правильный ход',
    success: '✅ Вариант сыгран правильно',
    failed: '❌ Есть ошибки',
    attempt: 'Попытка',
    userMoves: 'Твоих ходов в линии',
    move: 'Ход',
    nextAttempt: 'Следующая попытка',
  },
  en: {
    training: 'Training',
    completed: 'Completed',
    sequence: 'Sequence',
    progress: 'Attempt',
    successful: 'Successful',
    errors: 'Errors',
    start: 'Start training',
    playLine: 'Play the line from memory. The bot will answer with line moves.',
    wrongMove: 'Wrong move',
    correctMove: 'Correct move',
    success: '✅ Variation played correctly',
    failed: '❌ Mistakes found',
    attempt: 'Attempt',
    userMoves: 'Your moves in line',
    move: 'Move',
    nextAttempt: 'Next attempt',
  },
  kk: {
    training: 'Жаттығу',
    completed: 'Үйренілді',
    sequence: 'Жүрістер тізбегі',
    progress: 'Талпыныс',
    successful: 'Сәтті',
    errors: 'Қателер',
    start: 'Жаттығуды бастау',
    playLine: 'Вариантты жатқа ойна. Бот линия бойынша жауап береді.',
    wrongMove: 'Қате жүріс',
    correctMove: 'Дұрыс жүріс',
    success: '✅ Вариант дұрыс ойналды',
    failed: '❌ Қателер бар',
    attempt: 'Талпыныс',
    userMoves: 'Линиядағы сенің жүрістерің',
    move: 'Жүріс',
    nextAttempt: 'Келесі талпыныс',
  },
};
