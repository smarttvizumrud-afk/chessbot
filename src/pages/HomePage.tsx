import { AuthGate } from '../components/AuthGate';
import { ConnectPanel } from '../components/ConnectPanel';
import { GameList } from '../components/GameList';
import { StatGrid } from '../components/StatGrid';
import { combinedPlan, dashboardStats } from '../lib/insights';
import { t } from '../lib/i18n';
import type { Lang } from '../lib/types';
import { useChessData } from '../lib/useChessData';

export function HomePage({ lang }: { lang: Lang }) {
  return (
    <AuthGate>
      <Dashboard lang={lang} />
    </AuthGate>
  );
}

function Dashboard({ lang }: { lang: Lang }) {
  const { games, analyses, loading, error, refresh } = useChessData();
  const stats = dashboardStats(games, analyses);
  const plan = combinedPlan(analyses);

  return (
    <div className="page-grid">
      <section className="hero">
        <p>Stockfish + personal AI insights</p>
        <h1>{t(lang, 'app')}</h1>
      </section>
      <ConnectPanel lang={lang} onDone={refresh} />
      {loading && <section className="panel">Loading...</section>}
      {error && <section className="panel warning">{error}</section>}
      {!loading && !games.length && <section className="panel">{t(lang, 'noData')}</section>}
      <StatGrid stats={[
        { label: 'Rating', value: stats.rating || '-' },
        { label: 'Games', value: stats.total },
        { label: 'W-D-L', value: `${stats.wins}-${stats.draws}-${stats.losses}` },
        { label: 'Accuracy', value: `${stats.accuracy}%` },
        { label: 'Mistakes', value: stats.mistakes },
        { label: 'Blunders', value: stats.blunders },
      ]} />
      <section className="panel">
        <h2>{t(lang, 'improve')}</h2>
        <ul className="chips">
          {(plan.length ? plan : stats.weaknesses).map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>
      <GameList games={games} analyses={analyses} />
    </div>
  );
}
