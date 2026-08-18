import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { AuthGate } from '../components/AuthGate';
import { generatePuzzlesFromAnalyses } from '../lib/puzzleGenerator';
import { loadPuzzles, savePuzzleGenerationResult } from '../lib/puzzles';
import { loadAnalyses, loadGames } from '../lib/storage';
import { t } from '../lib/i18n';
import type { Lang, StoredPuzzle } from '../lib/types';

const text: Record<Lang, {
  title: string;
  empty: string;
  solve: string;
  source: string;
  rating: string;
  generate: string;
  generating: string;
  generated: string;
}> = {
  ru: {
    title: 'Chess puzzles',
    empty: 'No puzzles yet. Import and analyse games first.',
    solve: 'Solve',
    source: 'Source',
    rating: 'Rating',
    generate: 'Generate from my mistakes',
    generating: 'Generating...',
    generated: 'Generated puzzles from your game mistakes.',
  },
  en: {
    title: 'Chess puzzles',
    empty: 'No puzzles yet. Import and analyse games first.',
    solve: 'Solve',
    source: 'Source',
    rating: 'Rating',
    generate: 'Generate from my mistakes',
    generating: 'Generating...',
    generated: 'Generated puzzles from your game mistakes.',
  },
  kk: {
    title: 'Chess puzzles',
    empty: 'No puzzles yet. Import and analyse games first.',
    solve: 'Solve',
    source: 'Source',
    rating: 'Rating',
    generate: 'Generate from my mistakes',
    generating: 'Generating...',
    generated: 'Generated puzzles from your game mistakes.',
  },
};

export function PuzzlesPage({ lang }: { lang: Lang }) {
  return (
    <AuthGate lang={lang}>
      <PuzzlesContent lang={lang} />
    </AuthGate>
  );
}

function PuzzlesContent({ lang }: { lang: Lang }) {
  const labels = text[lang];
  const [puzzles, setPuzzles] = useState<StoredPuzzle[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  async function refresh() {
    setPuzzles(await loadPuzzles());
  }

  async function handleGenerate() {
    setBusy(true);
    setMessage('');
    try {
      const [games, analyses] = await Promise.all([loadGames(), loadAnalyses()]);
      const results = generatePuzzlesFromAnalyses(games, analyses);
      await Promise.all(results.map(savePuzzleGenerationResult));
      await refresh();
      setMessage(labels.generated);
    } catch (error) {
      console.warn('Could not generate puzzles from mistakes.', error);
      setMessage('Could not generate puzzles from saved analyses.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <section className="panel">{t(lang, 'loading')}</section>;

  return (
    <section className="panel">
      <div className="task-header">
        <div>
          <h1>{labels.title}</h1>
          <p>{labels.empty}</p>
        </div>
        <button type="button" onClick={handleGenerate} disabled={busy}>
          {busy ? labels.generating : labels.generate}
        </button>
      </div>
      {message && <p className="message">{message}</p>}
      {!puzzles.length && <p>{labels.empty}</p>}
      <div className="table-list">
        {puzzles.map((puzzle) => (
          <article className="table-row" key={puzzle.id}>
            <div>
              <strong>{puzzle.theme}</strong>
              <p>{labels.source}: {puzzle.sourceMove} · {puzzle.sideToMove}</p>
            </div>
            <span>{labels.rating}: {puzzle.rating}</span>
            <Link href={`/puzzle/${puzzle.id}`} className="account-link">{labels.solve}</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
