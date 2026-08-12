import { useState } from 'react';
import { Route, Switch } from 'wouter';
import { Layout } from './components/Layout';
import type { Lang } from './lib/types';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { AuthPage } from './pages/AuthPage';
import { CoachPage } from './pages/CoachPage';
import { GamePage } from './pages/GamePage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OpeningsPage } from './pages/OpeningsPage';

export default function App() {
  const [lang, setLang] = useState<Lang>('ru');

  function changeLang(nextLang: Lang) {
    setLang(nextLang);
  }

  return (
    <Layout lang={lang} onLangChange={changeLang}>
      <Switch>
        <Route path="/">{() => <HomePage lang={lang} />}</Route>
        <Route path="/auth">{() => <AuthPage lang={lang} />}</Route>
        <Route path="/auth/callback">{() => <AuthCallbackPage lang={lang} />}</Route>
        <Route path="/openings">{() => <OpeningsPage lang={lang} />}</Route>
        <Route path="/coach">{() => <CoachPage lang={lang} />}</Route>
        <Route path="/game/:id">{(params) => <GamePage lang={lang} id={params.id} />}</Route>
        <Route component={NotFoundPage} />
      </Switch>
    </Layout>
  );
}
