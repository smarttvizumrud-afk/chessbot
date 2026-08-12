import { Route, Switch } from 'wouter';
import { Layout } from './components/Layout';
import type { Lang } from './lib/types';
import { CoachPage } from './pages/CoachPage';
import { GamePage } from './pages/GamePage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OpeningsPage } from './pages/OpeningsPage';

export default function App() {
  const lang = getSavedLang();

  return (
    <Layout lang={lang}>
      <Switch>
        <Route path="/">{() => <HomePage lang={lang} />}</Route>
        <Route path="/openings">{() => <OpeningsPage lang={lang} />}</Route>
        <Route path="/coach">{() => <CoachPage lang={lang} />}</Route>
        <Route path="/game/:id">{(params) => <GamePage lang={lang} id={params.id} />}</Route>
        <Route component={NotFoundPage} />
      </Switch>
    </Layout>
  );
}

function getSavedLang(): Lang {
  const saved = window.localStorage.getItem('lang');
  return saved === 'en' || saved === 'kk' ? saved : 'ru';
}
