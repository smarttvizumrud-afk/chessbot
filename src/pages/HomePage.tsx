import { AuthGate } from '../components/AuthGate';
import { ConnectPanel } from '../components/ConnectPanel';
import { GameList } from '../components/GameList';
import { StatGrid } from '../components/StatGrid';
import { WeeklyHistory } from '../components/WeeklyHistory';
import { dashboardStats, gameAdvice } from '../lib/insights';
import { t } from '../lib/i18n';
import type { Lang } from '../lib/types';
import type { InterfaceMode } from '../lib/userOnboarding';
import { useChessData } from '../lib/useChessData';
import { useState } from 'react';

type Props = {
  lang: Lang;
  interfaceMode: InterfaceMode;
  onLangChange?: (lang: Lang) => void;
};

export function HomePage({ lang, interfaceMode, onLangChange }: Props) {
  return (
    <AuthGate lang={lang} onLangChange={onLangChange}>
      <Dashboard lang={lang} interfaceMode={interfaceMode} />
    </AuthGate>
  );
}

function Dashboard({ lang, interfaceMode }: { lang: Lang; interfaceMode: InterfaceMode }) {
  const { games, analyses, profiles, loading, error, refresh } = useChessData();
  const [closedAnalyses, setClosedAnalyses] = useState<string[]>([]);
  const stats = dashboardStats(games, analyses);
  const profile = profiles[0];
  const advice = gameAdvice(games, analyses);
  const closeAnalysis = (id: string) => setClosedAnalyses((ids) => [...new Set([...ids, id])]);

  return (
    <div className="page-grid">
      <HomeHero lang={lang} interfaceMode={interfaceMode} />
      <ConnectPanel lang={lang} onDone={refresh} />
      {loading && <section className="panel">{t(lang, 'loading')}</section>}
      {error && <section className="panel warning">{error}</section>}
      {!loading && !games.length && <section className="panel">{t(lang, 'noData')}</section>}
      <StatGrid stats={[
        { label: 'Classical', value: profile?.classical ?? '-' },
        { label: 'Rapid', value: profile?.rapid ?? '-' },
        { label: 'Blitz', value: profile?.blitz ?? '-' },
        { label: t(lang, 'games'), value: stats.total },
        { label: t(lang, 'score'), value: `${stats.wins}-${stats.draws}-${stats.losses}` },
        { label: t(lang, 'accuracy'), value: `${stats.accuracy}%` },
        { label: t(lang, 'mistakes'), value: stats.mistakes },
        { label: t(lang, 'blunders'), value: stats.blunders },
      ]} />
      <section className="panel">
        <h2>{t(lang, 'improve')}</h2>
        <ul className="advice-list">
          {advice.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <GameList games={games} analyses={analyses} closedAnalyses={closedAnalyses} lang={lang} onClose={closeAnalysis} />
      <WeeklyHistory games={games} analyses={analyses} closedAnalyses={closedAnalyses} lang={lang} onClose={closeAnalysis} />
    </div>
  );
}

function HomeHero({ lang, interfaceMode }: { lang: Lang; interfaceMode: InterfaceMode }) {
  const isKidsMode = interfaceMode === 'child' || interfaceMode === 'preschool';
  const isStudentMode = interfaceMode === 'student';
  const title = isStudentMode ? studentHeroTitle(lang) : t(lang, 'app');
  const kicker = isStudentMode ? studentHeroKicker(lang) : t(lang, 'heroKicker');

  return (
    <section className="hero">
      {isKidsMode && (
        <video className="hero-video" autoPlay muted loop playsInline preload="auto">
          <source src="/kids-hero.mp4" type="video/mp4" />
        </video>
      )}
      <div className="hero-copy">
        <p>{kicker}</p>
        <h1>{title}</h1>
      </div>
    </section>
  );
}

function studentHeroTitle(lang: Lang) {
  if (lang === 'en') return 'Play chess. Become a champion.';
  if (lang === 'kk') return 'Shakhmat oina. Chempion bol.';
  return 'Играй в шахматы. Становись чемпионом.';
}

function studentHeroKicker(lang: Lang) {
  if (lang === 'en') return 'Train, analyse, win more games.';
  if (lang === 'kk') return 'Uiren, oina, zheniske zhet.';
  return 'Учись, играй, побеждай.';
}
