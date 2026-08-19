import { useEffect, useState } from 'react';
import { Route, Switch } from 'wouter';
import { Layout } from './components/Layout';
import type { AppTheme, BoardStyle, Lang, PieceStyle } from './lib/types';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { AuthPage } from './pages/AuthPage';
import { CoachPage } from './pages/CoachPage';
import { EndgamesPage } from './pages/EndgamesPage';
import { GamePage } from './pages/GamePage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OpeningsPage } from './pages/OpeningsPage';
import { PuzzlePage } from './pages/PuzzlePage';
import { PuzzlesPage } from './pages/PuzzlesPage';
import { PricingPage } from './pages/PricingPage';
import { TrainingPage } from './pages/TrainingPage';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { readOnboardingData, type InterfaceMode } from './lib/userOnboarding';

export default function App() {
  const [lang, setLang] = useState<Lang>('ru');
  const [theme, setTheme] = useState<AppTheme>('dark');
  const [boardStyle, setBoardStyle] = useState<BoardStyle>('classic');
  const [pieceStyle, setPieceStyle] = useState<PieceStyle>('classic');
  const [interfaceMode, setInterfaceMode] = useState<InterfaceMode>('main');

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => {
      const metadata = readOnboardingData(data.session?.user.user_metadata);
      const preferredLang = metadata.preferredLang;
      if (preferredLang) setLang(preferredLang);
      if (data.session) setInterfaceMode(metadata.interfaceMode ?? 'student');
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const metadata = readOnboardingData(session?.user.user_metadata);
      const preferredLang = metadata.preferredLang;
      if (preferredLang) setLang(preferredLang);
      setInterfaceMode(session ? metadata.interfaceMode ?? 'student' : 'main');
    });
    return () => data.subscription.unsubscribe();
  }, []);

  function changeLang(nextLang: Lang) {
    setLang(nextLang);
  }

  return (
    <Layout
      lang={lang}
      theme={theme}
      interfaceMode={interfaceMode}
      boardStyle={boardStyle}
      pieceStyle={pieceStyle}
      onLangChange={changeLang}
      onThemeChange={setTheme}
      onBoardStyleChange={setBoardStyle}
      onPieceStyleChange={setPieceStyle}
    >
      <Switch>
        <Route path="/">
          {() => hasAuthCallbackParams()
            ? <AuthCallbackPage lang={lang} />
            : <HomePage lang={lang} interfaceMode={interfaceMode} onLangChange={setLang} />}
        </Route>
        <Route path="/auth">{() => <AuthPage lang={lang} onLangChange={setLang} />}</Route>
        <Route path="/auth/callback">{() => <AuthCallbackPage lang={lang} />}</Route>
        <Route path="/openings">{() => <OpeningsPage lang={lang} boardStyle={boardStyle} pieceStyle={pieceStyle} />}</Route>
        <Route path="/puzzles">{() => <PuzzlesPage lang={lang} />}</Route>
        <Route path="/endgames">{() => <EndgamesPage lang={lang} />}</Route>
        <Route path="/pricing">{() => <PricingPage lang={lang} onLangChange={setLang} />}</Route>
        <Route path="/training">{() => <TrainingPage lang={lang} />}</Route>
        <Route path="/coach">{() => <CoachPage lang={lang} />}</Route>
        <Route path="/game/:id">
          {(params) => <GamePage lang={lang} id={params.id} boardStyle={boardStyle} pieceStyle={pieceStyle} />}
        </Route>
        <Route path="/puzzle/:id">
          {(params) => <PuzzlePage lang={lang} id={params.id} boardStyle={boardStyle} pieceStyle={pieceStyle} />}
        </Route>
        <Route component={NotFoundPage} />
      </Switch>
    </Layout>
  );
}

function hasAuthCallbackParams() {
  const params = new URLSearchParams(window.location.search);
  return params.has('code') || params.has('error') || params.has('error_description');
}
