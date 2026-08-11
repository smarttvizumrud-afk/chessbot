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
  const title = lang === 'en' ? 'Opening report' : lang === 'kk' ? 'Дебют есебі' : 'Отчёт по дебютам';

  return (
    <section className="panel">
      <h1>{title}</h1>
      {loading && <p>Loading...</p>}
      <div className="table">
        {openings.map((item) => (
          <article className="table-row" key={item.opening}>
            <div>
              <strong>{item.opening}</strong>
              <p>{item.recommendation}</p>
            </div>
            <span>{item.games} games</span>
            <span>{item.score || '-'}%</span>
            <span>{item.errors} errors</span>
          </article>
        ))}
      </div>
    </section>
  );
}
