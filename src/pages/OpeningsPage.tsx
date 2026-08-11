import { AuthGate } from '../components/AuthGate';
import { openingStats } from '../lib/insights';
import type { Lang } from '../lib/types';
import { useChessData } from '../lib/useChessData';

export function OpeningsPage({ lang }: { lang: Lang }) {
  return (
    <AuthGate>
      <OpeningsContent lang={lang} />
    </AuthGate>
  );
}

function OpeningsContent({ lang }: { lang: Lang }) {
  const { games, analyses, loading } = useChessData();
  const openings = openingStats(games, analyses);
  const text = pageText(lang);

  return (
    <section className="panel">
      <h1>{text.title}</h1>
      {loading && <p>Loading...</p>}
      {!loading && !openings.length && <p>{text.empty}</p>}
      <div className="table">
        {openings.map((item) => (
          <article className="table-row" key={item.opening}>
            <div>
              <strong>{item.opening}</strong>
              <p>{item.recommendation}</p>
            </div>
            <span>{item.games} {text.games}</span>
            <span>{item.score || '-'}%</span>
            <span>{item.errors} {text.errors}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function pageText(lang: Lang) {
  if (lang === 'en') return { title: 'Opening report', empty: 'No openings yet.', games: 'games', errors: 'errors' };
  if (lang === 'kk') return { title: 'Дебют есебі', empty: 'Әзірге дебюттер жоқ.', games: 'партия', errors: 'қате' };
  return { title: 'Отчёт по дебютам', empty: 'Пока нет дебютов.', games: 'партий', errors: 'ошибок' };
}
