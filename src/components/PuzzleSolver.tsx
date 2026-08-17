import { useEffect, useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import type { BoardStyle, Lang, PieceStyle, StoredPuzzle } from '../lib/types';
import { useResponsiveBoardWidth } from '../lib/useResponsiveBoardWidth';

type Props = {
  puzzle: StoredPuzzle;
  boardStyle: BoardStyle;
  pieceStyle: PieceStyle;
  lang: Lang;
};

type Copy = {
  wrong: string;
  solved: string;
  retry: string;
  solution: string;
  difficulty: string;
  rating: string;
  hint: string;
  showSolution: string;
  yourMove: string;
  findBest: string;
  source: string;
  themes: string;
  themeHelp: string;
  task: string;
  fromGame: string;
  ratingMode: string;
};

const text: Record<Lang, Copy> = {
  ru: {
    wrong: 'Неверный ход. Попробуй ещё раз.',
    solved: 'Верно!',
    retry: 'Попробовать снова',
    solution: 'Решение',
    difficulty: 'Сложность',
    rating: 'Рейтинг',
    hint: 'Взять подсказку',
    showSolution: 'Посмотреть решение',
    yourMove: 'Ваш ход',
    findBest: 'Найдите лучший ход',
    source: 'Источник',
    themes: 'Темы задач',
    themeHelp: 'Позиция взята из твоей партии. Найди ход, который Stockfish считал лучшим.',
    task: 'Задача',
    fromGame: 'Из партии',
    ratingMode: 'Рейтинговая',
  },
  en: {
    wrong: 'Wrong move. Try again.',
    solved: 'Correct!',
    retry: 'Try again',
    solution: 'Solution',
    difficulty: 'Difficulty',
    rating: 'Rating',
    hint: 'Get a hint',
    showSolution: 'Show solution',
    yourMove: 'Your move',
    findBest: 'Find the best move',
    source: 'Source',
    themes: 'Puzzle themes',
    themeHelp: 'This position came from your game. Find the move Stockfish preferred.',
    task: 'Puzzle',
    fromGame: 'From game',
    ratingMode: 'Rated',
  },
  kk: {
    wrong: 'Қате жүріс. Қайта көр.',
    solved: 'Дұрыс!',
    retry: 'Қайта көру',
    solution: 'Шешімі',
    difficulty: 'Қиындық',
    rating: 'Рейтинг',
    hint: 'Көмек алу',
    showSolution: 'Шешімді көру',
    yourMove: 'Сенің жүрісің',
    findBest: 'Ең жақсы жүрісті тап',
    source: 'Дереккөз',
    themes: 'Тапсырма тақырыптары',
    themeHelp: 'Бұл позиция сенің партияңнан алынды. Stockfish таңдаған ең жақсы жүрісті тап.',
    task: 'Тапсырма',
    fromGame: 'Партиядан',
    ratingMode: 'Рейтингтік',
  },
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
  const [hintLevel, setHintLevel] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const colors = boardStyles[boardStyle];
  const { boardWrapRef, boardWidth } = useResponsiveBoardWidth();
  const expectedMove = puzzle.solution[0] ?? puzzle.bestMove;
  void pieceStyle;

  useEffect(() => {
    setFen(puzzle.fen);
    setMessage('');
    setSolved(false);
    setHintLevel(0);
    setShowSolution(false);
  }, [puzzle]);

  function dropPiece(sourceSquare: string, targetSquare: string) {
    if (solved || showSolution) return false;
    if (`${sourceSquare}${targetSquare}` !== expectedMove.slice(0, 4)) {
      setMessage(labels.wrong);
      return false;
    }

    const chess = new Chess(fen);
    const move = chess.move({ from: sourceSquare, to: targetSquare, promotion: expectedMove[4] ?? 'q' });
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
    setHintLevel(0);
    setShowSolution(false);
  }

  const sideText = puzzle.sideToMove === 'white' ? sideLabel(lang, 'white') : sideLabel(lang, 'black');

  return (
    <section className="puzzle-layout">
      <aside className="puzzle-sidebar">
        <article className="puzzle-card puzzle-info-card">
          <div className="puzzle-icon" aria-hidden="true">◎</div>
          <div>
            <p>{labels.task} № <strong>#{puzzle.id.slice(0, 5)}</strong></p>
            <p>{labels.rating}: <span>{puzzle.rating}</span></p>
            <p>{labels.fromGame}: {puzzle.sourceMove}</p>
          </div>
        </article>

        <article className="puzzle-card puzzle-rating-card">
          <span>{labels.ratingMode}</span>
          <strong>{puzzle.rating}</strong>
        </article>

        <article className="puzzle-card">
          <h2>{labels.themes}</h2>
          <span className="puzzle-badge">{themeText(puzzle.theme, lang)}</span>
          <p>{labels.themeHelp}</p>
        </article>
      </aside>

      <div className="puzzle-board-area">
        <div className="board-wrap puzzle-board-wrap" ref={boardWrapRef}>
          <Chessboard
            position={fen}
            boardWidth={boardWidth}
            boardOrientation={puzzle.sideToMove}
            customLightSquareStyle={{ backgroundColor: colors.light }}
            customDarkSquareStyle={{ backgroundColor: colors.dark }}
            onPieceDrop={dropPiece}
          />
        </div>
      </div>

      <aside className="puzzle-play-panel">
        <div className="puzzle-move-list" aria-label={labels.solution}>
          <div><span>FEN</span><strong>{puzzle.fen}</strong></div>
          <div><span>{labels.difficulty}</span><strong>{puzzle.difficulty}/5</strong></div>
        </div>

        <div className="puzzle-turn-card">
          <span className="puzzle-king" aria-hidden="true">{puzzle.sideToMove === 'white' ? '♔' : '♚'}</span>
          <div>
            <h1>{labels.yourMove}</h1>
            <p>{labels.findBest} {sideText}.</p>
          </div>
        </div>

        <p>{explanationText(puzzle.explanation, puzzle.bestMove, puzzle.theme, lang)}</p>
        {hintLevel > 0 && <p className="message">{hintText(puzzle, hintLevel, lang)}</p>}
        {message && <p className="message">{message}</p>}
        {(solved || showSolution) && <p><strong>{labels.solution}:</strong> {puzzle.solution.join(' ')}</p>}

        <div className="puzzle-action-links">
          <button type="button" onClick={() => setHintLevel((level) => Math.min(level + 1, 3))}>
            {labels.hint}
          </button>
          <button type="button" onClick={() => setShowSolution(true)}>
            {labels.showSolution}
          </button>
        </div>
        <button type="button" onClick={reset}>{labels.retry}</button>
      </aside>
    </section>
  );
}

function sideLabel(lang: Lang, side: 'white' | 'black') {
  if (lang === 'ru') return side === 'white' ? 'за белых' : 'за чёрных';
  if (lang === 'kk') return side === 'white' ? 'ақтар үшін' : 'қаралар үшін';
  return side === 'white' ? 'for White' : 'for Black';
}

function hintText(puzzle: StoredPuzzle, level: number, lang: Lang) {
  const move = puzzle.solution[0] ?? puzzle.bestMove;
  if (level === 1) {
    if (lang === 'ru') return `Ищи тему: ${themeText(puzzle.theme, lang)}.`;
    if (lang === 'kk') return `Тақырыпты ізде: ${themeText(puzzle.theme, lang)}.`;
    return `Look for: ${themeText(puzzle.theme, lang)}.`;
  }
  if (level === 2) {
    if (lang === 'ru') return `Правильная фигура начинает ход с поля ${move.slice(0, 2)}.`;
    if (lang === 'kk') return `Дұрыс фигура ${move.slice(0, 2)} шаршысынан жүреді.`;
    return `The right piece starts from ${move.slice(0, 2)}.`;
  }
  if (lang === 'ru') return `Лучший ход: ${move}.`;
  if (lang === 'kk') return `Ең жақсы жүріс: ${move}.`;
  return `Best move: ${move}.`;
}

function themeText(theme: string, lang: Lang) {
  const values: Record<string, Record<Lang, string>> = {
    'tactical vision': { ru: 'тактическое зрение', en: 'tactical vision', kk: 'тактикалық көру' },
    'win material': { ru: 'выигрыш материала', en: 'win material', kk: 'материал ұту' },
    combination: { ru: 'комбинация', en: 'combination', kk: 'комбинация' },
    'mate attack': { ru: 'матовая атака', en: 'mate attack', kk: 'мат шабуылы' },
    'opening tactic': { ru: 'дебютная тактика', en: 'opening tactic', kk: 'дебют тактикасы' },
    'opening plans': { ru: 'планы в дебюте', en: 'opening plans', kk: 'дебют жоспарлары' },
    'endgame technique': { ru: 'техника эндшпиля', en: 'endgame technique', kk: 'эндшпиль техникасы' },
    'forcing moves': { ru: 'форсированные ходы', en: 'forcing moves', kk: 'мәжбүрлейтін жүрістер' },
    'tactical contact': { ru: 'тактический контакт', en: 'tactical contact', kk: 'тактикалық байланыс' },
  };
  return values[theme]?.[lang] ?? theme;
}

function explanationText(explanation: string, bestMove: string, theme: string, lang: Lang) {
  const loss = explanation.match(/lost about (\d+) centipawns/)?.[1];
  if (lang === 'en') return explanation;
  if (lang === 'kk') {
    return loss
      ? `Бұл қате шамамен ${loss} centipawn жоғалтты. Stockfish ${bestMove} жүрісін таңдады. Негізгі тақырып: ${themeText(theme, lang)}.`
      : `Stockfish ұсынған ең жақсы жүріс: ${bestMove}. Тақырып: ${themeText(theme, lang)}.`;
  }
  return loss
    ? `Этот зевок потерял примерно ${loss} сантипешек. Stockfish предпочитал ${bestMove}. Главная тема: ${themeText(theme, lang)}.`
    : `Лучший ход Stockfish: ${bestMove}. Тема: ${themeText(theme, lang)}.`;
}
