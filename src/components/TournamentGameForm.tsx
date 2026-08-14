import { useState } from 'react';
import { Chess } from 'chess.js';
import { analyzeGame } from '../lib/analyzer';
import { getOpening, getPgnHeader } from '../lib/pgn';
import { generatePuzzlesForGame } from '../lib/puzzleGenerator';
import { saveGeneratedPuzzles } from '../lib/puzzles';
import { saveAnalysis, saveGame } from '../lib/storage';
import { StockfishClient } from '../lib/stockfish';
import type { GameResult, ImportedGame, Lang, PlayerColor } from '../lib/types';

type Props = { lang: Lang; onDone: () => Promise<void> };

const text: Record<Lang, {
  title: string;
  button: string;
  username: string;
  opponent: string;
  rating: string;
  pgn: string;
  save: string;
  saved: string;
  invalid: string;
}> = {
  ru: {
    title: 'Record tournament game',
    button: 'Record tournament game',
    username: 'Your name',
    opponent: 'Opponent',
    rating: 'Your rating',
    pgn: 'Paste PGN',
    save: 'Save and analyse',
    saved: 'Tournament game saved, analysed, and converted into puzzles.',
    invalid: 'PGN is invalid. Check the moves and try again.',
  },
  en: {
    title: 'Record tournament game',
    button: 'Record tournament game',
    username: 'Your name',
    opponent: 'Opponent',
    rating: 'Your rating',
    pgn: 'Paste PGN',
    save: 'Save and analyse',
    saved: 'Tournament game saved, analysed, and converted into puzzles.',
    invalid: 'PGN is invalid. Check the moves and try again.',
  },
  kk: {
    title: 'Record tournament game',
    button: 'Record tournament game',
    username: 'Your name',
    opponent: 'Opponent',
    rating: 'Your rating',
    pgn: 'Paste PGN',
    save: 'Save and analyse',
    saved: 'Tournament game saved, analysed, and converted into puzzles.',
    invalid: 'PGN is invalid. Check the moves and try again.',
  },
};

export function TournamentGameForm({ lang, onDone }: Props) {
  const labels = text[lang];
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [opponent, setOpponent] = useState('');
  const [rating, setRating] = useState('');
  const [color, setColor] = useState<PlayerColor>('white');
  const [result, setResult] = useState<GameResult>('win');
  const [pgn, setPgn] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const engine = new StockfishClient();
    try {
      const game = toImportedGame({ username, opponent, rating, color, result, pgn });
      const stored = await saveGame(game);
      const analysis = await analyzeGame(game, engine);
      const storedAnalysis = await saveAnalysis(stored.id, analysis);
      await saveGeneratedPuzzles(generatePuzzlesForGame(stored, storedAnalysis));
      await onDone();
      setMessage(labels.saved);
    } catch (error) {
      console.warn('Could not save tournament game.', error);
      setMessage(labels.invalid);
    } finally {
      engine.stop();
      setBusy(false);
    }
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
          <input value={rating} onChange={(event) => setRating(event.target.value)} placeholder={labels.rating} inputMode="numeric" />
          <select value={color} onChange={(event) => setColor(event.target.value as PlayerColor)}>
            <option value="white">White</option>
            <option value="black">Black</option>
          </select>
          <select value={result} onChange={(event) => setResult(event.target.value as GameResult)}>
            <option value="win">Win</option>
            <option value="draw">Draw</option>
            <option value="loss">Loss</option>
          </select>
          <textarea value={pgn} onChange={(event) => setPgn(event.target.value)} placeholder={labels.pgn} required />
          <button type="submit" disabled={busy}>{busy ? '...' : labels.save}</button>
        </form>
      )}
      {message && <p className="message">{message}</p>}
    </section>
  );
}

function toImportedGame(values: {
  username: string;
  opponent: string;
  rating: string;
  color: PlayerColor;
  result: GameResult;
  pgn: string;
}): ImportedGame {
  const chess = new Chess();
  chess.loadPgn(values.pgn, { strict: false });
  if (!chess.history().length) throw new Error('PGN has no moves.');

  return {
    platform: 'lichess',
    platformGameId: `tournament-${crypto.randomUUID()}`,
    username: values.username.trim(),
    opponent: values.opponent.trim() || opponentFromPgn(values.pgn, values.color),
    playedAt: new Date().toISOString(),
    result: values.result,
    color: values.color,
    playerRating: Number(values.rating) || undefined,
    opening: getOpening(values.pgn),
    pgn: values.pgn.trim(),
    timeControl: 'tournament',
  };
}

function opponentFromPgn(pgn: string, color: PlayerColor) {
  const header = color === 'white' ? 'Black' : 'White';
  return getPgnHeader(pgn, header) || 'Tournament opponent';
}
