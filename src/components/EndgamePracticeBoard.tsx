import { useEffect, useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import type { EndgameCard } from '../lib/endgameCatalog';
import { StockfishClient } from '../lib/stockfish';
import type { Lang, PlayerColor } from '../lib/types';
import { useResponsiveBoardWidth } from '../lib/useResponsiveBoardWidth';

type Props = {
  card: EndgameCard;
  lang: Lang;
};

type EndgamePractice = {
  fen: string;
  hint: string;
  goal: string;
  sideToMove: PlayerColor;
};

const copy: Record<Lang, {
  yourMove: string;
  computer: string;
  thinking: string;
  wrong: string;
  hint: string;
  reset: string;
  gameOver: string;
  engineError: string;
}> = {
  ru: {
    yourMove: 'Играй против компьютера',
    computer: 'Компьютер сыграл',
    thinking: 'Компьютер думает...',
    wrong: 'Так ходить нельзя.',
    hint: 'Подсказка',
    reset: 'Сбросить',
    gameOver: 'Партия закончена.',
    engineError: 'Компьютер не смог ответить. Попробуй сбросить позицию.',
  },
  en: {
    yourMove: 'Play against the computer',
    computer: 'Computer played',
    thinking: 'Computer is thinking...',
    wrong: 'Illegal move.',
    hint: 'Hint',
    reset: 'Reset',
    gameOver: 'Game over.',
    engineError: 'The computer could not reply. Try resetting the position.',
  },
  kk: {
    yourMove: 'Kompiuterge qarsy oina',
    computer: 'Kompiuter oynady',
    thinking: 'Kompiuter oilanyp jatyr...',
    wrong: 'Bul juris bolmaidy.',
    hint: 'Komek',
    reset: 'Qaita bastau',
    gameOver: 'Partia ayaqtaldy.',
    engineError: 'Kompiuter jauap bere almady. Pozitsiany qaita basta.',
  },
};

const boardColors = { light: '#f0d9b5', dark: '#b58863' };

export function EndgamePracticeBoard({ card, lang }: Props) {
  const labels = copy[lang];
  const practice = useMemo(() => practiceFor(card.title), [card.title]);
  const [fen, setFen] = useState(practice.fen);
  const [message, setMessage] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [lastComputerMove, setLastComputerMove] = useState('');
  const { boardWrapRef, boardWidth } = useResponsiveBoardWidth();

  useEffect(() => {
    setFen(practice.fen);
    setMessage('');
    setShowHint(false);
    setThinking(false);
    setLastComputerMove('');
  }, [practice]);

  function dropPiece(sourceSquare: string, targetSquare: string) {
    if (thinking) return false;
    const chess = new Chess(fen);
    if (chess.turn() !== 'w') return false;

    const move = movePiece(chess, sourceSquare, targetSquare);
    if (!move) {
      setMessage(labels.wrong);
      return false;
    }

    const nextFen = chess.fen();
    setFen(nextFen);
    setMessage('');
    setLastComputerMove('');
    if (chess.isGameOver()) {
      setMessage(labels.gameOver);
      return true;
    }
    void playComputerMove(nextFen);
    return true;
  }

  async function playComputerMove(position: string) {
    setThinking(true);
    setMessage(labels.thinking);
    const engine = new StockfishClient();
    try {
      const line = await engine.evaluate(position, 8);
      const chess = new Chess(position);
      const bestMove = line.bestMove;
      if (!bestMove || bestMove === '(none)') {
        setMessage(labels.gameOver);
        return;
      }
      const move = movePiece(chess, bestMove.slice(0, 2), bestMove.slice(2, 4), bestMove[4]);
      if (!move) {
        setMessage(labels.engineError);
        return;
      }
      setFen(chess.fen());
      setLastComputerMove(move.san);
      setMessage(chess.isGameOver() ? labels.gameOver : '');
    } catch (error) {
      console.warn('Could not play computer endgame move.', error);
      setMessage(labels.engineError);
    } finally {
      engine.stop();
      setThinking(false);
    }
  }

  function reset() {
    setFen(practice.fen);
    setMessage('');
    setShowHint(false);
    setThinking(false);
    setLastComputerMove('');
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
        {lastComputerMove && <p><strong>{labels.computer}:</strong> {lastComputerMove}</p>}
        <div className="puzzle-actions">
          <button type="button" onClick={() => setShowHint(true)}>{labels.hint}</button>
          <button type="button" onClick={reset}>{labels.reset}</button>
        </div>
      </aside>
    </section>
  );
}

function practiceFor(title: string): EndgamePractice {
  const lower = title.toLowerCase();
  if (matches(lower, ['пешечные прорывы', 'pawn breaks'])) {
    return drill('6k1/8/8/1ppp4/1PPP4/8/8/6K1 w - - 0 1', 'Ищи пешечный прорыв, даже если пешка временно отдаётся.');
  }
  if (matches(lower, ['отдалённая', 'outside'])) {
    return drill('6k1/8/8/8/P1P5/8/8/6K1 w - - 0 1', 'Создай проходную далеко от короля соперника.');
  }
  if (matches(lower, ['ладейные', 'rook endgames'])) {
    return drill('6k1/8/8/8/8/8/6KP/R7 w - - 0 1', 'Ладья должна стать активной и давать шахи сбоку.');
  }
  if (matches(lower, ['ладья против', 'rook vs'])) {
    return drill('6k1/8/8/8/8/8/6Kp/R7 w - - 0 1', 'Останови пешку активной ладьёй, не стой пассивно.');
  }
  if (matches(lower, ['ферзевые', 'queen endgames'])) {
    return drill('6k1/8/8/8/8/8/6K1/7Q w - - 0 1', 'В ферзевом эндшпиле первым ищи шахи и вечный шах.');
  }
  if (matches(lower, ['ферзь против', 'queen vs'])) {
    return drill('8/6k1/6p1/8/8/8/6K1/7Q w - - 0 1', 'Шахами отталкивай короля от пешки.');
  }
  if (matches(lower, ['слоновые', 'bishop endgames'])) {
    return drill('6k1/8/8/2B1P3/4K3/8/8/8 w - - 0 1', 'Слон лучше работает на открытой диагонали.');
  }
  if (matches(lower, ['коневые', 'knight endgames'])) {
    return drill('6k1/8/8/8/3N4/4K3/8/8 w - - 0 1', 'Конь любит вилки и сильные поля.');
  }
  if (matches(lower, ['разноцветные', 'opposite'])) {
    return drill('6k1/8/8/2B1P3/4K3/8/8/8 w - - 0 1', 'Создавай вторую слабость, одной пешки часто мало.');
  }
  if (matches(lower, ['слон против коня', 'bishop vs knight'])) {
    return drill('n5k1/8/8/2B5/4K3/8/8/8 w - - 0 1', 'Открой позицию для слона.');
  }
  if (matches(lower, ['фигура против', 'piece vs'])) {
    return drill('6k1/8/8/3P4/4K3/8/8/6N1 w - - 0 1', 'Фигура должна успеть остановить проходные пешки.');
  }
  if (matches(lower, ['лишняя фигура', 'extra piece'])) {
    return drill('6k1/8/8/3P4/4K3/8/8/6N1 w - - 0 1', 'Сначала останови контригру, потом реализуй перевес.');
  }
  if (matches(lower, ['качество', 'exchange'])) {
    return drill('6k1/8/8/8/4K3/8/8/R5n1 w - - 0 1', 'Активная ладья должна проникнуть на 7-ю линию.');
  }
  if (matches(lower, ['ферзь и король', 'queen mate'])) {
    return drill('6k1/8/6K1/8/8/8/8/7Q w - - 0 1', 'Отрезай короля и не допускай пата.');
  }
  if (matches(lower, ['ладья и король', 'rook mate'])) {
    return drill('6k1/8/6K1/8/8/8/8/7R w - - 0 1', 'Ладья отрезает короля, свой король помогает.');
  }
  if (matches(lower, ['два слона', 'two bishops'])) {
    return drill('6k1/8/6K1/3B4/8/8/8/2B5 w - - 0 1', 'Держи диагонали двумя слонами.');
  }
  if (matches(lower, ['слон и конь', 'bishop and knight'])) {
    return drill('6k1/8/6K1/3B4/5N2/8/8/8 w - - 0 1', 'Гони короля в угол цвета слона.');
  }
  return drill('6k1/8/8/4P3/4K3/8/8/8 w - - 0 1', 'Займи оппозицию королём.');
}

function drill(fen: string, hint: string): EndgamePractice {
  return {
    fen,
    hint,
    goal: 'Доиграй эту эндшпильную позицию за белых против компьютера.',
    sideToMove: 'white',
  };
}

function matches(value: string, needles: string[]) {
  return needles.some((needle) => value.includes(needle));
}

function movePiece(chess: Chess, from: string, to: string, promotion?: string) {
  if (promotion) return chess.move({ from, to, promotion });
  const piece = chess.get(from as Parameters<Chess['get']>[0]);
  const promotes = piece?.type === 'p' && (to[1] === '1' || to[1] === '8');
  return chess.move(promotes ? { from, to, promotion: 'q' } : { from, to });
}
