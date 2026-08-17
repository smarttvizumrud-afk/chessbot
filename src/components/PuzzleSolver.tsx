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

const text: Record<Lang, {
  wrong: string;
  solved: string;
  retry: string;
  solution: string;
  difficulty: string;
  rating: string;
  hint: string;
}> = {
  ru: { wrong: 'Неверный ход. Попробуй ещё раз.', solved: 'Верно!', retry: 'Попробовать снова', solution: 'Решение', difficulty: 'Сложность', rating: 'Рейтинг', hint: 'Подсказка' },
  en: { wrong: 'Wrong move. Try again.', solved: 'Correct!', retry: 'Try again', solution: 'Solution', difficulty: 'Difficulty', rating: 'Rating', hint: 'Hint' },
  kk: { wrong: 'Қате жүріс. Қайта көр.', solved: 'Дұрыс!', retry: 'Қайта көру', solution: 'Шешімі', difficulty: 'Қиындық', rating: 'Рейтинг', hint: 'Көмек' },
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
  const colors = boardStyles[boardStyle];
  const { boardWrapRef, boardWidth } = useResponsiveBoardWidth();
  void pieceStyle;

  useEffect(() => {
    setFen(puzzle.fen);
    setMessage('');
    setSolved(false);
    setHintLevel(0);
  }, [puzzle]);

  function dropPiece(sourceSquare: string, targetSquare: string) {
    if (solved) return false;
    const expected = puzzle.solution[0] ?? puzzle.bestMove;
    if (`${sourceSquare}${targetSquare}` !== expected.slice(0, 4)) {
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
    setHintLevel(0);
  }

  return (
    <section className="analysis-layout">
      <div className="board-panel">
        <div className="board-wrap" ref={boardWrapRef}>
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
      <article className="panel puzzle-panel">
        <span className="puzzle-badge">{themeText(puzzle.theme, lang)}</span>
        <h1>{labels.rating}: {puzzle.rating}</h1>
        <p>{labels.difficulty}: {puzzle.difficulty}/5</p>
        <p>FEN: {puzzle.fen}</p>
        <p>{explanationText(puzzle.explanation, puzzle.bestMove, puzzle.theme, lang)}</p>
        {hintLevel > 0 && <p className="message">{hintText(puzzle, hintLevel, lang)}</p>}
        {message && <p className="message">{message}</p>}
        {solved && <p><strong>{labels.solution}:</strong> {puzzle.solution.join(' ')}</p>}
        <div className="puzzle-actions">
          <button type="button" onClick={reset}>{labels.retry}</button>
          <button className="ghost" type="button" onClick={() => setHintLevel((level) => Math.min(level + 1, 3))}>
            {labels.hint}
          </button>
        </div>
      </article>
    </section>
  );
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
