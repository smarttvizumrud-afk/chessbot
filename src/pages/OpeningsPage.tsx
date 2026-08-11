import { AuthGate } from '../components/AuthGate';
import { openingRecommendationText, t } from '../lib/i18n';
import { openingStats } from '../lib/insights';
import type { Lang } from '../lib/types';
import { useChessData } from '../lib/useChessData';

export function OpeningsPage({ lang }: { lang: Lang }) {
  return (
    <AuthGate lang={lang}>
      <OpeningsContent lang={lang} />
    </AuthGate>
  );
}

function OpeningsContent({ lang }: { lang: Lang }) {
  const { games, analyses, loading } = useChessData();
  const openings = openingStats(games, analyses);

  return (
    <section className="panel">
      <h1>{t(lang, 'openingReport')}</h1>
      {loading && <p>{t(lang, 'loading')}</p>}
      {!loading && !openings.length && <p>{t(lang, 'noOpenings')}</p>}
      <div className="table">
        {openings.map((item) => (
          <article className="table-row" key={item.opening}>
            <div>
              <strong>{item.opening}</strong>
              <p>{openingRecommendationText(lang, item.opening, item.score, item.errors)}</p>
            </div>
            <span>{item.games} {t(lang, 'games').toLowerCase()}</span>
            <span>{item.score || '-'}%</span>
            <span>{item.errors} {t(lang, 'errors')}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
