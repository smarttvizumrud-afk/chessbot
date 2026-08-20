import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthGate } from '../components/AuthGate';
import { AnalysisBoard } from '../components/AnalysisBoard';
import { MoveTable } from '../components/MoveTable';
import { coachPersona, personaAdvice } from '../lib/coachPersona';
import { createCoachSpeechAudio, speakCoachText } from '../lib/coachSpeech';
import { labelText, localizeInsight, t } from '../lib/i18n';
import { fenAfterPly, getMovesWithFens } from '../lib/pgn';
import { supabase } from '../lib/supabase';
import type { BoardStyle, Lang, MoveReport, PieceStyle, PlayerColor } from '../lib/types';
import { ageFromBirthDate, readOnboardingData, type Gender, type InterfaceMode } from '../lib/userOnboarding';
import { useChessData } from '../lib/useChessData';

export function GamePage({
  id,
  lang,
  boardStyle,
  pieceStyle,
}: {
  id: string;
  lang: Lang;
  boardStyle: BoardStyle;
  pieceStyle: PieceStyle;
}) {
  return (
    <AuthGate lang={lang}>
      <GameContent id={id} lang={lang} boardStyle={boardStyle} pieceStyle={pieceStyle} />
    </AuthGate>
  );
}

function GameContent({
  id,
  lang,
  boardStyle,
  pieceStyle,
}: {
  id: string;
  lang: Lang;
  boardStyle: BoardStyle;
  pieceStyle: PieceStyle;
}) {
  const { games, analyses, loading } = useChessData();
  const game = games.find((item) => item.id === id);
  const analysis = analyses.find((item) => item.gameId === id);
  const [ply, setPly] = useState(0);
  const [interfaceMode, setInterfaceMode] = useState<InterfaceMode>('main');
  const [gender, setGender] = useState<Gender>('male');
  const [userAge, setUserAge] = useState<number>();
  const report = analysis?.moveReports.find((item) => item.ply === ply);
  const totalPly = useMemo(() => game ? getMovesWithFens(game.pgn).length : 0, [game]);
  const fen = useMemo(() => game ? fenAfterPly(game.pgn, ply) : '', [game, ply]);
  const selectPly = useCallback((nextPly: number) => {
    setPly(nextPly);
    const nextReport = analysis?.moveReports.find((item) => item.ply === nextPly);
    if (!nextReport) return;

    const advice = analysisCoachAdvice(nextReport, interfaceMode, gender, lang, userAge);
    const preparedAudio = createCoachSpeechAudio();
    speakCoachText(advice, interfaceMode, gender, preparedAudio)
      .catch((error) => console.warn('Could not speak selected move advice.', error));
  }, [analysis, gender, interfaceMode, lang, userAge]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const metadata = readOnboardingData(data.user?.user_metadata);
      if (metadata.interfaceMode) setInterfaceMode(metadata.interfaceMode);
      if (metadata.gender) setGender(metadata.gender);
      if (metadata.birthDate) setUserAge(ageFromBirthDate(metadata.birthDate) ?? undefined);
    });
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const nextPly = event.key === 'ArrowLeft'
        ? Math.max(ply - 1, 0)
        : Math.min(ply + 1, totalPly);
      selectPly(nextPly);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ply, selectPly, totalPly]);

  if (loading) return <section className="panel">{t(lang, 'loading')}</section>;
  if (!game || !analysis || !fen) return <section className="panel">{t(lang, 'notFound')}</section>;

  return (
    <div className="analysis-layout">
      <section className="board-panel">
        <AnalysisBoard fen={fen} boardStyle={boardStyle} pieceStyle={pieceStyle} />
      </section>
      <section className="panel">
        <h1>{t(lang, 'gameAnalysis')}</h1>
        <p>{game.username} {t(lang, 'versus')} {game.opponent} · {analysis.accuracy}% {t(lang, 'accuracy').toLowerCase()}</p>
        <MoveTable reports={analysis.moveReports} selectedPly={ply} lang={lang} onSelect={selectPly} />
        <AnalysisCoachCard
          report={report}
          playerColor={game.color}
          lang={lang}
          interfaceMode={interfaceMode}
          gender={gender}
          userAge={userAge}
        />
      </section>
    </div>
  );
}

function AnalysisCoachCard({
  report,
  playerColor,
  lang,
  interfaceMode,
  gender,
  userAge,
}: {
  report?: MoveReport;
  playerColor: PlayerColor;
  lang: Lang;
  interfaceMode: InterfaceMode;
  gender: Gender;
  userAge?: number;
}) {
  const [speechBusy, setSpeechBusy] = useState(false);
  const [speechNotice, setSpeechNotice] = useState('');
  const persona = coachPersona(interfaceMode, gender, lang, userAge);
  const advice = report
    ? analysisCoachAdvice(report, interfaceMode, gender, lang, userAge)
    : idleAdvice(persona, lang);

  async function playAdvice() {
    if (speechBusy) return;
    setSpeechBusy(true);
    setSpeechNotice('');
    const preparedAudio = createCoachSpeechAudio();
    try {
      await speakCoachText(advice, interfaceMode, gender, preparedAudio);
    } catch (error) {
      console.warn('Could not speak analysis advice.', error);
      setSpeechNotice('Voice did not start. Press Audio again.');
    } finally {
      setSpeechBusy(false);
    }
  }

  return (
    <article className="persona-advice">
      <span className={`coach-avatar ${gender}`}>{persona.icon}</span>
      <div>
        <div className="persona-advice-head">
          <strong>{persona.name}</strong>
          <button
            className="analysis-speak-button"
            type="button"
            onClick={() => void playAdvice()}
            disabled={speechBusy}
          >
            {speechBusy ? '...' : 'Audio'}
          </button>
        </div>
        <p>{advice}</p>
        {speechNotice && <p className="message">{speechNotice}</p>}
        {report && <MoveComment report={report} playerColor={playerColor} lang={lang} />}
      </div>
    </article>
  );
}

function analysisCoachAdvice(
  report: MoveReport,
  interfaceMode: InterfaceMode,
  gender: Gender,
  lang: Lang,
  userAge?: number,
) {
  const persona = coachPersona(interfaceMode, gender, lang, userAge);
  return personaAdvice(persona, lang, humanAdvice(report, lang));
}

function MoveComment({ report, playerColor, lang }: {
  report: MoveReport;
  playerColor: PlayerColor;
  lang: Lang;
}) {
  const side = report.side ?? sideFromPly(report.ply, playerColor);
  const sideLabel = side === 'player' ? t(lang, 'yourMove') : t(lang, 'opponentMove');
  const theme = localizeInsight(report.theme, lang);

  return (
    <article className="critical">
      <b>{sideLabel}: {labelText(lang, report.label)} · {theme}</b>
      <p>{t(lang, 'move')}: {report.san}. {t(lang, 'best')}: {report.bestMove}.</p>
      {report.label !== 'good' && <p>{commentText(report, lang)}</p>}
    </article>
  );
}

function commentText(report: MoveReport, lang: Lang) {
  return `${t(lang, 'evalChanged')} ${Math.round(report.loss)} ${t(lang, 'centipawns')}. ${explainReport(report, lang)}`;
}

function humanAdvice(report: MoveReport, lang: Lang) {
  if (report.label === 'good') {
    if (lang === 'en') return 'Nice move. Keep asking what your opponent wants next.';
    if (lang === 'kk') return 'Жақсы жүріс. Енді қарсылас не істегісі келетінін тексер.';
    return 'Хороший ход. Теперь просто проверь, что хочет соперник следующим ходом.';
  }
  if (lang === 'en') return `Pause here. ${report.san} missed ${report.bestMove}. First check checks, captures, and threats.`;
  if (lang === 'kk') return `Осы жерде тоқта. ${report.san} орнына ${report.bestMove} жақсы еді. Алдымен шах, алу және қауіптерді тексер.`;
  return `Вот здесь остановись. Вместо ${report.san} сильнее было ${report.bestMove}. Сначала проверь шахи, взятия и угрозы.`;
}

function idleAdvice(persona: ReturnType<typeof coachPersona>, lang: Lang) {
  if (lang === 'en') return personaAdvice(persona, lang, 'Pick a move from the table, and I will explain it in simple words.');
  if (lang === 'kk') return personaAdvice(persona, lang, 'Кестеден жүрісті таңда, мен оны қарапайым тілмен түсіндіремін.');
  return personaAdvice(persona, lang, 'Выбери ход в таблице, и я объясню его простыми словами.');
}

function explainReport(report: MoveReport, lang: Lang) {
  if (report.label === 'good') {
    if (lang === 'en') return 'The move stayed close to the engine recommendation.';
    if (lang === 'kk') return 'Бұл жүріс қозғалтқыш ұсынған нұсқаға жақын болды.';
    return 'Этот ход был близок к рекомендации движка.';
  }
  const theme = localizeInsight(report.theme, lang);
  if (lang === 'en') return `The main theme is ${theme}; look for forcing moves before committing.`;
  if (lang === 'kk') return `Негізгі тақырып: ${theme}; жүріс жасамас бұрын мәжбүрлейтін нұсқаларды тексер.`;
  return `Главная тема: ${theme}; перед ходом проверь форсированные варианты.`;
}

function sideFromPly(ply: number, playerColor: PlayerColor) {
  const playerParity = playerColor === 'white' ? 1 : 0;
  return ply % 2 === playerParity ? 'player' : 'opponent';
}
