import { useState } from 'react';
import { Chess } from 'chess.js';
import { analyzeGame } from '../lib/analyzer';
import { getOpening } from '../lib/pgn';
import { generatePuzzlesForGame } from '../lib/puzzleGenerator';
import { savePuzzleResultForGame } from '../lib/puzzles';
import { saveAnalysis, saveGame } from '../lib/storage';
import { StockfishClient } from '../lib/stockfish';
import type { GameResult, ImportedGame, Lang, PlayerColor } from '../lib/types';

type Props = { lang: Lang; onDone: () => Promise<void> };
type MoveRow = { white: string; black: string };

const text: Record<Lang, {
  button: string;
  username: string;
  opponent: string;
  whiteRating: string;
  blackRating: string;
  white: string;
  black: string;
  addMove: string;
  save: string;
  saved: string;
  invalid: string;
}> = {
  ru: {
    button: 'Записать партию с турнира',
    username: 'Твоё имя',
    opponent: 'Соперник',
    whiteRating: 'Рейтинг белых',
    blackRating: 'Рейтинг чёрных',
    white: 'Ход белых',
    black: 'Ход чёрных',
    addMove: 'Добавить ход',
    save: 'Сохранить и проанализировать',
    saved: 'Партия сохранена, проанализирована и превращена в задачи.',
    invalid: 'Ходы неверные. Проверь запись и попробуй ещё раз.',
  },
  en: {
    button: 'Record tournament game',
    username: 'Your name',
    opponent: 'Opponent',
    whiteRating: 'White rating',
    blackRating: 'Black rating',
    white: 'White move',
    black: 'Black move',
    addMove: 'Add move',
    save: 'Save and analyse',
    saved: 'Tournament game saved, analysed, and converted into puzzles.',
    invalid: 'Moves are invalid. Check the notation and try again.',
  },
  kk: {
    button: 'Турнир партиясын жазу',
    username: 'Өз атың',
    opponent: 'Қарсылас',
    whiteRating: 'Ақтардың рейтингі',
    blackRating: 'Қаралардың рейтингі',
    white: 'Ақтардың жүрісі',
    black: 'Қаралардың жүрісі',
    addMove: 'Жүріс қосу',
    save: 'Сақтау және талдау',
    saved: 'Партия сақталды, талданды және есептерге айналды.',
    invalid: 'Жүрістер қате. Жазуды тексеріп, қайта көр.',
  },
};

const initialRows: MoveRow[] = Array.from({ length: 12 }, () => ({ white: '', black: '' }));

export function TournamentGameForm({ lang, onDone }: Props) {
  const labels = text[lang];
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [opponent, setOpponent] = useState('');
  const [whiteRating, setWhiteRating] = useState('');
  const [blackRating, setBlackRating] = useState('');
  const [color, setColor] = useState<PlayerColor>('white');
  const [result, setResult] = useState<GameResult>('win');
  const [moveRows, setMoveRows] = useState<MoveRow[]>(initialRows);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const engine = new StockfishClient();
    try {
      const moves = moveRowsToText(moveRows);
      const game = toImportedGame({ username, opponent, whiteRating, blackRating, color, result, moves });
      const stored = await saveGame(game);
      const analysis = await analyzeGame(game, engine);
      const storedAnalysis = await saveAnalysis(stored.id, analysis);
      const puzzles = generatePuzzlesForGame(stored, storedAnalysis);
      await savePuzzleResultForGame(stored, puzzles);
      await onDone();
      setMessage(puzzles.length ? labels.saved : noPuzzleText(lang));
    } catch (error) {
      console.warn('Could not save tournament game.', error);
      setMessage(labels.invalid);
    } finally {
      engine.stop();
      setBusy(false);
    }
  }

  function updateMove(index: number, side: keyof MoveRow, value: string) {
    setMoveRows((rows) => rows.map((row, rowIndex) => (
      rowIndex === index ? { ...row, [side]: value } : row
    )));
  }

  return (
    <section className="manual-game">
      <button className="ghost" type="button" onClick={() => setOpen((value) => !value)}>
        {labels.button}
      </button>
      {open && (
        <form className="coach-form tournament-form" onSubmit={submit}>
          <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder={labels.username} required />
          <input value={opponent} onChange={(event) => setOpponent(event.target.value)} placeholder={labels.opponent} required />
          <input value={whiteRating} onChange={(event) => setWhiteRating(event.target.value)} placeholder={labels.whiteRating} inputMode="numeric" />
          <input value={blackRating} onChange={(event) => setBlackRating(event.target.value)} placeholder={labels.blackRating} inputMode="numeric" />
          <select value={color} onChange={(event) => setColor(event.target.value as PlayerColor)}>
            <option value="white">{colorText(lang, 'white')}</option>
            <option value="black">{colorText(lang, 'black')}</option>
          </select>
          <select value={result} onChange={(event) => setResult(event.target.value as GameResult)}>
            <option value="win">{resultText(lang, 'win')}</option>
            <option value="draw">{resultText(lang, 'draw')}</option>
            <option value="loss">{resultText(lang, 'loss')}</option>
          </select>
          <div className="move-sheet">
            <div className="move-sheet-head">
              <span>#</span>
              <span>{labels.white}</span>
              <span>{labels.black}</span>
            </div>
            {moveRows.map((row, index) => (
              <div className="move-row" key={index}>
                <span>{index + 1}.</span>
                <input value={row.white} onChange={(event) => updateMove(index, 'white', event.target.value)} placeholder={labels.white} />
                <input value={row.black} onChange={(event) => updateMove(index, 'black', event.target.value)} placeholder={labels.black} />
              </div>
            ))}
            <button className="ghost" type="button" onClick={() => setMoveRows((rows) => [...rows, { white: '', black: '' }])}>
              {labels.addMove}
            </button>
          </div>
          <button type="submit" disabled={busy}>{busy ? '...' : labels.save}</button>
        </form>
      )}
      {message && <p className="message">{message}</p>}
    </section>
  );
}

function moveRowsToText(rows: MoveRow[]) {
  return rows
    .flatMap((row) => [row.white.trim(), row.black.trim()])
    .filter(Boolean)
    .join(' ');
}

function toImportedGame(values: {
  username: string;
  opponent: string;
  whiteRating: string;
  blackRating: string;
  color: PlayerColor;
  result: GameResult;
  moves: string;
}): ImportedGame {
  const pgn = recreatePgn(values.moves, values);

  return {
    platform: 'lichess',
    platformGameId: `tournament-${crypto.randomUUID()}`,
    username: values.username.trim(),
    opponent: values.opponent.trim(),
    playedAt: new Date().toISOString(),
    result: values.result,
    color: values.color,
    playerRating: playerRating(values),
    opening: getOpening(pgn),
    pgn,
    timeControl: 'tournament',
  };
}

function playerRating(values: { color: PlayerColor; whiteRating: string; blackRating: string }) {
  const rating = values.color === 'white' ? values.whiteRating : values.blackRating;
  return Number(rating) || undefined;
}

function recreatePgn(
  input: string,
  values: { username: string; opponent: string; color: PlayerColor; result: GameResult },
) {
  const chess = new Chess();
  moveTokens(input).forEach((token) => {
    const move = uciMove(token);
    const played = move
      ? chess.move({ from: move.from, to: move.to, promotion: move.promotion })
      : chess.move(token);
    if (!played) throw new Error(`Invalid move: ${token}`);
  });

  if (!chess.history().length) throw new Error('No moves.');
  return withHeaders(chess.pgn(), values);
}

function moveTokens(input: string) {
  return input
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => !/^\d+\.(\.\.)?$/.test(token))
    .filter((token) => !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(token))
    .map((token) => token.replace(/^\d+\.\.\./, '').replace(/^\d+\./, ''))
    .filter(Boolean);
}

function uciMove(token: string) {
  const match = token.match(/^([a-h][1-8])([a-h][1-8])([nbrq])?$/i);
  if (!match) return null;
  return { from: match[1], to: match[2], promotion: match[3]?.toLowerCase() ?? 'q' };
}

function withHeaders(pgn: string, values: { username: string; opponent: string; color: PlayerColor; result: GameResult }) {
  const white = values.color === 'white' ? values.username : values.opponent;
  const black = values.color === 'black' ? values.username : values.opponent;
  const result = resultTag(values.result, values.color);
  return [
    '[Event "Tournament game"]',
    '[Site "Manual entry"]',
    `[Date "${new Date().toISOString().slice(0, 10).replace(/-/g, '.')}"]`,
    `[White "${white.trim() || 'White'}"]`,
    `[Black "${black.trim() || 'Black'}"]`,
    `[Result "${result}"]`,
    '',
    `${pgn} ${result}`,
  ].join('\n');
}

function resultTag(result: GameResult, color: PlayerColor) {
  if (result === 'draw') return '1/2-1/2';
  if (result === 'win') return color === 'white' ? '1-0' : '0-1';
  return color === 'white' ? '0-1' : '1-0';
}

function colorText(lang: Lang, color: PlayerColor) {
  if (lang === 'ru') return color === 'white' ? 'Белыми' : 'Чёрными';
  if (lang === 'kk') return color === 'white' ? 'Ақтар' : 'Қаралар';
  return color === 'white' ? 'White' : 'Black';
}

function resultText(lang: Lang, result: GameResult) {
  if (lang === 'ru') {
    if (result === 'win') return 'Победа';
    if (result === 'draw') return 'Ничья';
    return 'Поражение';
  }
  if (lang === 'kk') {
    if (result === 'win') return 'Жеңіс';
    if (result === 'draw') return 'Тең ойын';
    return 'Жеңіліс';
  }
  if (result === 'win') return 'Win';
  if (result === 'draw') return 'Draw';
  return 'Loss';
}

function noPuzzleText(lang: Lang) {
  if (lang === 'ru') return 'Партия сохранена, но подходящей позиции для задачи не найдено.';
  if (lang === 'kk') return 'Партия сақталды, бірақ тапсырмаға лайық позиция табылмады.';
  return 'Game saved, but no suitable puzzle position was found.';
}
