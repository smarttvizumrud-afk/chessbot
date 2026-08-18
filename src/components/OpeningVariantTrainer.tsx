import { useEffect, useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { saveOpeningAttempt, type OpeningProgress } from '../lib/openingProgress';
import { openingName, variantName } from '../lib/openingLocalization';
import type { OpeningVariant } from '../lib/openingVariants';
import type { BoardStyle, Lang, PieceStyle } from '../lib/types';
import { usePositionEvaluation } from '../lib/usePositionEvaluation';
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
  const evaluation = usePositionEvaluation(chess.fen());
  const [lineIndex, setLineIndex] = useState(0);
  const [studyPly, setStudyPly] = useState(0);
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
    playBotMoves(startPosition(), 0);
  }

  function showNextStudyMove() {
    if (started || studyPly >= variant.moves.length) return;
    const nextChess = new Chess(chess.fen());
    nextChess.move(variant.moves[studyPly].san);
    setChess(nextChess);
    setStudyPly((ply) => ply + 1);
  }

  function restartStudy() {
    resetBoard(false);
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
    const nextChess = startPosition();
    setChess(nextChess);
    setLineIndex(0);
    setStudyPly(0);
    setStarted(shouldStart);
    setAttemptDone(false);
    setAttemptFailed(false);
    setWrongMoves([]);
    setMessage(shouldStart ? labels.playLine : '');
  }

  function startPosition() {
    return variant.startFen === 'start' ? new Chess() : new Chess(variant.startFen);
  }

  const completed = successfulAttempts >= 3 || progress?.status === 'completed';
  const studyMode = !started && !completed;
  const studyDone = studyPly >= variant.moves.length;

  return (
    <section className="opening-trainer">
      <article className="opening-study-card">
        <span className="puzzle-badge">{completed ? labels.completed : studyMode ? labels.study : labels.memory}</span>
        <h2>{openingName(variant.opening, lang)}</h2>
        <h3>{variantName(variant.variant, lang)}</h3>
        {studyMode && (
          <>
            <p>{labels.sequence}: {formatLine(variant.moves.map((move) => move.san))}</p>
            <p>{labels.ideas}: {variant.ideas}</p>
            <p>{labels.shownMoves}: {studyPly}/{variant.moves.length}</p>
          </>
        )}
        <p>{labels.progress}: {Math.min(successfulAttempts + 1, 3)}/3</p>
        <p>{labels.successful}: {successfulAttempts}/3 · {labels.errors}: {errorCount}</p>
        {studyMode && (
          <div className="opening-study-actions">
            <button type="button" onClick={showNextStudyMove} disabled={studyDone}>{studyDone ? labels.demoDone : labels.showNext}</button>
            <button className="ghost" type="button" onClick={restartStudy}>{labels.replay}</button>
            <button type="button" onClick={startTraining}>{labels.start}</button>
          </div>
        )}
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
          <div className="eval-chip">
            <span>{labels.evaluation}</span>
            <strong>{evaluation.loading ? '...' : evaluation.label}</strong>
          </div>
        </div>
      </article>

      <article className="opening-study-card">
        <h2>{labels.attempt} {Math.min(successfulAttempts + 1, 3)}/3</h2>
        <p>{started ? labels.memoryWarning : `${labels.userMoves}: ${userMoveCount}`}</p>
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

function formatLine(moves: string[]) {
  const pairs: string[] = [];
  for (let index = 0; index < moves.length; index += 2) {
    pairs.push(`${index / 2 + 1}. ${moves[index]}${moves[index + 1] ? ` ${moves[index + 1]}` : ''}`);
  }
  return pairs.join(' ');
}

const text: Record<Lang, Record<string, string>> = {
  ru: {
    study: 'Изучение',
    memory: 'Игра по памяти',
    training: 'Тренировка',
    completed: 'Изучено',
    sequence: 'Последовательность',
    ideas: 'Основные идеи',
    shownMoves: 'Показано ходов',
    evaluation: 'Оценка позиции',
    showNext: 'Показать следующий ход',
    replay: 'Показать с начала',
    demoDone: 'Вариант показан',
    progress: 'Попытка',
    successful: 'Успешно',
    errors: 'Ошибки',
    start: 'Я готов — начать тренировку',
    playLine: 'Режим памяти: ходов больше не видно. Вспоминай вариант сам.',
    wrongMove: 'Неправильный ход',
    correctMove: 'Правильный ход',
    success: '✅ Вариант сыгран правильно',
    failed: '❌ Есть ошибки',
    attempt: 'Попытка',
    userMoves: 'Твоих ходов в линии',
    memoryWarning: 'Ходы скрыты. Бот отвечает по варианту, твоя задача — вспомнить правильные ходы.',
    move: 'Ход',
    nextAttempt: 'Следующая попытка',
  },
  en: {
    study: 'Study',
    memory: 'Memory game',
    training: 'Training',
    completed: 'Completed',
    sequence: 'Sequence',
    ideas: 'Main ideas',
    shownMoves: 'Shown moves',
    evaluation: 'Position evaluation',
    showNext: 'Show next move',
    replay: 'Show from start',
    demoDone: 'Line shown',
    progress: 'Attempt',
    successful: 'Successful',
    errors: 'Errors',
    start: 'I am ready — start training',
    playLine: 'Memory mode: the moves are hidden. Recall the variation yourself.',
    wrongMove: 'Wrong move',
    correctMove: 'Correct move',
    success: '✅ Variation played correctly',
    failed: '❌ Mistakes found',
    attempt: 'Attempt',
    userMoves: 'Your moves in line',
    memoryWarning: 'Moves are hidden. The bot follows the variation; you must remember the correct moves.',
    move: 'Move',
    nextAttempt: 'Next attempt',
  },
  kk: {
    study: 'Үйрену',
    memory: 'Жатқа ойнау',
    training: 'Жаттығу',
    completed: 'Үйренілді',
    sequence: 'Жүрістер тізбегі',
    ideas: 'Негізгі идеялар',
    shownMoves: 'Көрсетілген жүрістер',
    evaluation: 'Позиция бағасы',
    showNext: 'Келесі жүрісті көрсету',
    replay: 'Басынан көрсету',
    demoDone: 'Вариант көрсетілді',
    progress: 'Талпыныс',
    successful: 'Сәтті',
    errors: 'Қателер',
    start: 'Дайынмын — жаттығуды бастау',
    playLine: 'Жатқа ойнау режимі: жүрістер жасырылды. Вариантты өзің еске түсір.',
    wrongMove: 'Қате жүріс',
    correctMove: 'Дұрыс жүріс',
    success: '✅ Вариант дұрыс ойналды',
    failed: '❌ Қателер бар',
    attempt: 'Талпыныс',
    userMoves: 'Линиядағы сенің жүрістерің',
    memoryWarning: 'Жүрістер жасырылған. Бот вариант бойынша жауап береді, сен дұрыс жүрістерді еске түсір.',
    move: 'Жүріс',
    nextAttempt: 'Келесі талпыныс',
  },
};
