import { useEffect, useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import type { EndgameCard } from '../lib/endgameCatalog';
import type { Lang, PlayerColor } from '../lib/types';
import { useResponsiveBoardWidth } from '../lib/useResponsiveBoardWidth';

type Props = {
  card: EndgameCard;
  lang: Lang;
};

type EndgamePractice = {
  fen: string;
  solution: string;
  hint: string;
  goal: string;
  sideToMove: PlayerColor;
};

const copy: Record<Lang, {
  yourMove: string;
  right: string;
  wrong: string;
  hint: string;
  solution: string;
  reset: string;
}> = {
  ru: {
    yourMove: 'Твой ход',
    right: 'Верно. Отличный эндшпильный ход.',
    wrong: 'Не этот ход. Попробуй ещё раз.',
    hint: 'Подсказка',
    solution: 'Решение',
    reset: 'Сбросить',
  },
  en: {
    yourMove: 'Your move',
    right: 'Correct. Strong endgame move.',
    wrong: 'Not that move. Try again.',
    hint: 'Hint',
    solution: 'Solution',
    reset: 'Reset',
  },
  kk: {
    yourMove: 'Senin jurisin',
    right: 'Durys. Kushti endshpil jurisi.',
    wrong: 'Bul emes. Qaita kor.',
    hint: 'Komek',
    solution: 'Sheshim',
    reset: 'Qaita bastau',
  },
};

const boardColors = { light: '#f0d9b5', dark: '#b58863' };

export function EndgamePracticeBoard({ card, lang }: Props) {
  const labels = copy[lang];
  const practice = useMemo(() => practiceFor(card.title), [card.title]);
  const [fen, setFen] = useState(practice.fen);
  const [message, setMessage] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const { boardWrapRef, boardWidth } = useResponsiveBoardWidth();

  useEffect(() => {
    setFen(practice.fen);
    setMessage('');
    setShowHint(false);
    setShowSolution(false);
  }, [practice]);

  function dropPiece(sourceSquare: string, targetSquare: string) {
    if (showSolution) return false;
    if (`${sourceSquare}${targetSquare}` !== practice.solution.slice(0, 4)) {
      setMessage(labels.wrong);
      return false;
    }

    const chess = new Chess(fen);
    const promotion = practice.solution[4];
    const move = chess.move(
      promotion
        ? { from: sourceSquare, to: targetSquare, promotion }
        : { from: sourceSquare, to: targetSquare },
    );
    if (!move) return false;

    setFen(chess.fen());
    setMessage(labels.right);
    return true;
  }

  function reset() {
    setFen(practice.fen);
    setMessage('');
    setShowHint(false);
    setShowSolution(false);
  }

  return (
    <section className="puzzle-layout">
      <aside className="puzzle-sidebar">
        <article className="puzzle-card">
          <h2>{labels.yourMove}</h2>
          <p>{practice.goal}</p>
        </article>
        <article className="puzzle-card">
          <h2>{card.title}</h2>
          <p>{card.drill}</p>
        </article>
      </aside>

      <div className="puzzle-board-area">
        <div className="board-wrap puzzle-board-wrap" ref={boardWrapRef}>
          <Chessboard
            position={fen}
            boardWidth={boardWidth}
            boardOrientation={practice.sideToMove}
            customLightSquareStyle={{ backgroundColor: boardColors.light }}
            customDarkSquareStyle={{ backgroundColor: boardColors.dark }}
            onPieceDrop={dropPiece}
          />
        </div>
      </div>

      <aside className="puzzle-play-panel">
        {message && <p className="message">{message}</p>}
        {showHint && <p>{practice.hint}</p>}
        {showSolution && <p><strong>{labels.solution}:</strong> {practice.solution}</p>}
        <div className="puzzle-actions">
          <button type="button" onClick={() => setShowHint(true)}>{labels.hint}</button>
          <button type="button" onClick={() => setShowSolution(true)}>{labels.solution}</button>
          <button type="button" onClick={reset}>{labels.reset}</button>
        </div>
      </aside>
    </section>
  );
}

function practiceFor(title: string): EndgamePractice {
  const lower = title.toLowerCase();
  if (matches(lower, ['пешечные прорывы', 'pawn breaks'])) {
    return drill('6k1/8/8/1ppp4/1PPP4/8/8/6K1 w - - 0 1', 'c4b5', 'Ищи пешечный прорыв, даже если пешка временно отдаётся.');
  }
  if (matches(lower, ['отдалённая', 'outside'])) {
    return drill('6k1/8/8/8/P1P5/8/8/6K1 w - - 0 1', 'c4c5', 'Создай проходную далеко от короля соперника.');
  }
  if (matches(lower, ['ладейные', 'rook endgames'])) {
    return drill('6k1/8/8/8/8/8/6KP/R7 w - - 0 1', 'a1a8', 'Ладья должна стать активной и давать шахи сбоку.');
  }
  if (matches(lower, ['ладья против', 'rook vs'])) {
    return drill('6k1/8/8/8/8/8/6Kp/R7 w - - 0 1', 'a1a8', 'Останови пешку активной ладьёй, не стой пассивно.');
  }
  if (matches(lower, ['ферзевые', 'queen endgames'])) {
    return drill('6k1/8/8/8/8/8/6K1/7Q w - - 0 1', 'h1h7', 'В ферзевом эндшпиле первым ищи шахи и вечный шах.');
  }
  if (matches(lower, ['ферзь против', 'queen vs'])) {
    return drill('8/6k1/6p1/8/8/8/6K1/7Q w - - 0 1', 'h1h7', 'Шахами отталкивай короля от пешки.');
  }
  if (matches(lower, ['слоновые', 'bishop endgames'])) {
    return drill('6k1/8/8/2B1P3/4K3/8/8/8 w - - 0 1', 'c5d6', 'Слон лучше работает на открытой диагонали.');
  }
  if (matches(lower, ['коневые', 'knight endgames'])) {
    return drill('6k1/8/8/8/3N4/4K3/8/8 w - - 0 1', 'd4c6', 'Конь любит вилки и сильные поля.');
  }
  if (matches(lower, ['разноцветные', 'opposite'])) {
    return drill('6k1/8/8/2B1P3/4K3/8/8/8 w - - 0 1', 'c5d6', 'Создавай вторую слабость, одной пешки часто мало.');
  }
  if (matches(lower, ['слон против коня', 'bishop vs knight'])) {
    return drill('n5k1/8/8/2B5/4K3/8/8/8 w - - 0 1', 'c5d6', 'Открой позицию для слона.');
  }
  if (matches(lower, ['фигура против', 'piece vs'])) {
    return drill('6k1/8/8/3P4/4K3/8/8/6N1 w - - 0 1', 'g1f3', 'Фигура должна успеть остановить проходные пешки.');
  }
  if (matches(lower, ['лишняя фигура', 'extra piece'])) {
    return drill('6k1/8/8/3P4/4K3/8/8/6N1 w - - 0 1', 'g1f3', 'Сначала останови контригру, потом реализуй перевес.');
  }
  if (matches(lower, ['качество', 'exchange'])) {
    return drill('6k1/8/8/8/4K3/8/8/R5n1 w - - 0 1', 'a1a7', 'Активная ладья должна проникнуть на 7-ю линию.');
  }
  if (matches(lower, ['ферзь и король', 'queen mate'])) {
    return drill('6k1/8/6K1/8/8/8/8/7Q w - - 0 1', 'h1h7', 'Отрезай короля и не допускай пата.');
  }
  if (matches(lower, ['ладья и король', 'rook mate'])) {
    return drill('6k1/8/6K1/8/8/8/8/7R w - - 0 1', 'h1h8', 'Ладья отрезает короля, свой король помогает.');
  }
  if (matches(lower, ['два слона', 'two bishops'])) {
    return drill('6k1/8/6K1/3B4/8/8/8/2B5 w - - 0 1', 'c1a3', 'Держи диагонали двумя слонами.');
  }
  if (matches(lower, ['слон и конь', 'bishop and knight'])) {
    return drill('6k1/8/6K1/3B4/5N2/8/8/8 w - - 0 1', 'f4h5', 'Гони короля в угол цвета слона.');
  }
  return drill('6k1/8/8/4P3/4K3/8/8/8 w - - 0 1', 'e4d4', 'Займи оппозицию королём.');
}

function drill(fen: string, solution: string, hint: string): EndgamePractice {
  return {
    fen,
    solution,
    hint,
    goal: 'Найди лучший первый ход в этой эндшпильной позиции.',
    sideToMove: 'white',
  };
}

function matches(value: string, needles: string[]) {
  return needles.some((needle) => value.includes(needle));
}
