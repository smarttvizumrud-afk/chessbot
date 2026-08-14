import { useEffect, useState } from 'react';
import { AuthGate } from '../components/AuthGate';
import { PuzzleSolver } from '../components/PuzzleSolver';
import { t } from '../lib/i18n';
import { loadPuzzles } from '../lib/puzzles';
import type { BoardStyle, Lang, PieceStyle, StoredPuzzle } from '../lib/types';

export function PuzzlePage({
  id,
  lang,
  boardStyle,
  pieceStyle,
}: {
  id: string;
  lang: Lang;
  boardStyle: BoardStyle;
  pieceStyle: PieceStyle;
}) {
  return (
    <AuthGate lang={lang}>
      <PuzzleContent id={id} lang={lang} boardStyle={boardStyle} pieceStyle={pieceStyle} />
    </AuthGate>
  );
}

function PuzzleContent({
  id,
  lang,
  boardStyle,
  pieceStyle,
}: {
  id: string;
  lang: Lang;
  boardStyle: BoardStyle;
  pieceStyle: PieceStyle;
}) {
  const [puzzle, setPuzzle] = useState<StoredPuzzle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPuzzles()
      .then((items) => setPuzzle(items.find((item) => item.id === id) ?? null))
      .catch((error) => console.warn('Could not load puzzle.', error))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <section className="panel">{t(lang, 'loading')}</section>;
  if (!puzzle) return <section className="panel">{t(lang, 'notFound')}</section>;

  return <PuzzleSolver puzzle={puzzle} boardStyle={boardStyle} pieceStyle={pieceStyle} lang={lang} />;
}
