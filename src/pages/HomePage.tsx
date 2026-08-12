import { AuthGate } from '../components/AuthGate';
import { ConnectPanel } from '../components/ConnectPanel';
import { GameList } from '../components/GameList';
import { StatGrid } from '../components/StatGrid';
import { WeeklyHistory } from '../components/WeeklyHistory';
import { combinedPlan, dashboardStats } from '../lib/insights';
import { localizeInsight, t } from '../lib/i18n';
import type { Lang } from '../lib/types';
import { useChessData } from '../lib/useChessData';
import { useState } from 'react';

export function HomePage({ lang }: { lang: Lang }) {
  return (
    <AuthGate lang={lang}>
      <Dashboard lang={lang} />
    </AuthGate>
  );
}

function Dashboard({ lang }: { lang: Lang }) {
  const { games, analyses, loading, error, refresh } = useChessData();
  const [closedAnalyses, setClosedAnalyses] = useState<string[]>([]);
  const stats = dashboardStats(games, analyses);
  const plan = combinedPlan(analyses);
  const closeAnalysis = (id: string) => setClosedAnalyses((ids) => [...new Set([...ids, id])]);

  return (
    <div className="page-grid">
      <section className="hero">
        <p>{t(lang, 'heroKicker')}</p>
        <h1>{t(lang, 'app')}</h1>
      </section>
      <ConnectPanel lang={lang} onDone={refresh} />
      {loading && <section className="panel">{t(lang, 'loading')}</section>}
      {error && <section className="panel warning">{error}</section>}
      {!loading && !games.length && <section className="panel">{t(lang, 'noData')}</section>}
      <StatGrid stats={[
        { label: t(lang, 'rating'), value: stats.rating || '-' },
        { label: t(lang, 'games'), value: stats.total },
        { label: t(lang, 'score'), value: `${stats.wins}-${stats.draws}-${stats.losses}` },
        { label: t(lang, 'accuracy'), value: `${stats.accuracy}%` },
        { label: t(lang, 'mistakes'), value: stats.mistakes },
        { label: t(lang, 'blunders'), value: stats.blunders },
      ]} />
      <section className="panel">
        <h2>{t(lang, 'improve')}</h2>
        <ul className="chips">
          {(plan.length ? plan : stats.weaknesses).map((item) => (
            <li key={item}>{localizeInsight(item, lang)}</li>
          ))}
        </ul>
      </section>
      <GameList games={games} analyses={analyses} closedAnalyses={closedAnalyses} lang={lang} onClose={closeAnalysis} />
      <WeeklyHistory games={games} analyses={analyses} closedAnalyses={closedAnalyses} lang={lang} onClose={closeAnalysis} />
    </div>
  );
}
