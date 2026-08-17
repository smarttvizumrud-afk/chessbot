import { useEffect, useState } from 'react';
import { Route, Switch } from 'wouter';
import { Layout } from './components/Layout';
import type { AppTheme, BoardStyle, Lang, PieceStyle } from './lib/types';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { AuthPage } from './pages/AuthPage';
import { CoachPage } from './pages/CoachPage';
import { GamePage } from './pages/GamePage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OpeningsPage } from './pages/OpeningsPage';
import { PuzzlePage } from './pages/PuzzlePage';
import { PuzzlesPage } from './pages/PuzzlesPage';
import { TrainingPage } from './pages/TrainingPage';
import { isSupabaseConfigured, supabase } from './lib/supabase';

export default function App() {
  const [lang, setLang] = useState<Lang>('ru');
  const [theme, setTheme] = useState<AppTheme>('dark');
  const [boardStyle, setBoardStyle] = useState<BoardStyle>('classic');
  const [pieceStyle, setPieceStyle] = useState<PieceStyle>('classic');

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => {
      const preferredLang = readPreferredLang(data.session?.user.user_metadata);
      if (preferredLang) setLang(preferredLang);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const preferredLang = readPreferredLang(session?.user.user_metadata);
      if (preferredLang) setLang(preferredLang);
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
      boardStyle={boardStyle}
      pieceStyle={pieceStyle}
      onLangChange={changeLang}
      onThemeChange={setTheme}
      onBoardStyleChange={setBoardStyle}
      onPieceStyleChange={setPieceStyle}
    >
      <Switch>
        <Route path="/">{() => <HomePage lang={lang} onLangChange={setLang} />}</Route>
        <Route path="/auth">{() => <AuthPage lang={lang} onLangChange={setLang} />}</Route>
        <Route path="/auth/callback">{() => <AuthCallbackPage lang={lang} />}</Route>
        <Route path="/openings">{() => <OpeningsPage lang={lang} boardStyle={boardStyle} pieceStyle={pieceStyle} />}</Route>
        <Route path="/puzzles">{() => <PuzzlesPage lang={lang} />}</Route>
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

function readPreferredLang(metadata: unknown): Lang | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const value = (metadata as Record<string, unknown>).preferred_lang;
  return value === 'ru' || value === 'en' || value === 'kk' ? value : null;
}
