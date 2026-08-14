import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { AuthGate } from '../components/AuthGate';
import { loadPuzzles } from '../lib/puzzles';
import { t } from '../lib/i18n';
import type { Lang, StoredPuzzle } from '../lib/types';

const text: Record<Lang, { title: string; empty: string; solve: string; source: string }> = {
  ru: { title: 'Шахматные задачи', empty: 'Пока нет задач. Импортируй и проанализируй партии.', solve: 'Решать', source: 'Источник' },
  en: { title: 'Chess puzzles', empty: 'No puzzles yet. Import and analyse games first.', solve: 'Solve', source: 'Source' },
  kk: { title: 'Шахмат есептері', empty: 'Әзірге есеп жоқ. Алдымен партияларды талда.', solve: 'Шешу', source: 'Дереккөз' },
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

  useEffect(() => {
    loadPuzzles()
      .then(setPuzzles)
      .catch((error) => console.warn('Could not load puzzles.', error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <section className="panel">{t(lang, 'loading')}</section>;

  return (
    <section className="panel">
      <h1>{labels.title}</h1>
      {!puzzles.length && <p>{labels.empty}</p>}
      <div className="table-list">
        {puzzles.map((puzzle) => (
          <article className="table-row" key={puzzle.id}>
            <div>
              <strong>{puzzle.theme}</strong>
              <p>{labels.source}: {puzzle.sourceMove} · {puzzle.sideToMove}</p>
            </div>
            <span>{puzzle.difficulty}/5</span>
            <Link href={`/puzzle/${puzzle.id}`} className="account-link">{labels.solve}</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
