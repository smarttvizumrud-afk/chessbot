import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthGate } from '../components/AuthGate';
import { AnalysisBoard } from '../components/AnalysisBoard';
import { MoveTable } from '../components/MoveTable';
import { coachPersona, personaAdvice, personaIntro } from '../lib/coachPersona';
import { createCoachSpeechAudio, speakCoachText, speechErrorText } from '../lib/coachSpeech';
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
  const [adviceTurn, setAdviceTurn] = useState(0);
  const report = analysis?.moveReports.find((item) => item.ply === ply);
  const totalPly = useMemo(() => game ? getMovesWithFens(game.pgn).length : 0, [game]);
  const fen = useMemo(() => game ? fenAfterPly(game.pgn, ply) : '', [game, ply]);
  const selectPly = useCallback((nextPly: number) => {
    setPly(nextPly);
    setAdviceTurn((turn) => turn + 1);
    const nextReport = analysis?.moveReports.find((item) => item.ply === nextPly);
    if (!nextReport) return;

    const advice = analysisCoachSpeech(nextReport, interfaceMode, gender, lang, userAge, adviceTurn + 1);
    const preparedAudio = createCoachSpeechAudio();
    speakCoachText(advice, interfaceMode, gender, lang, preparedAudio)
      .catch((error) => console.warn('Could not speak selected move advice.', error));
  }, [adviceTurn, analysis, gender, interfaceMode, lang, userAge]);

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
          adviceTurn={adviceTurn}
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
  adviceTurn,
}: {
  report?: MoveReport;
  playerColor: PlayerColor;
  lang: Lang;
  interfaceMode: InterfaceMode;
  gender: Gender;
  userAge?: number;
  adviceTurn: number;
}) {
  const [speechBusy, setSpeechBusy] = useState(false);
  const [speechNotice, setSpeechNotice] = useState('');
  const [speechTurn, setSpeechTurn] = useState(0);
  const persona = coachPersona(interfaceMode, gender, lang, userAge);
  const advice = report
    ? analysisCoachAdvice(report, interfaceMode, gender, lang, userAge, adviceTurn)
    : idleAdvice(persona, lang);

  useEffect(() => {
    setSpeechTurn(0);
  }, [report?.ply]);

  async function playAdvice() {
    if (speechBusy) return;
    setSpeechBusy(true);
    setSpeechNotice('');
    const preparedAudio = createCoachSpeechAudio();
    const nextSpeechTurn = speechTurn + 1;
    setSpeechTurn(nextSpeechTurn);
    const spokenAdvice = report
      ? analysisCoachSpeech(report, interfaceMode, gender, lang, userAge, adviceTurn + nextSpeechTurn)
      : idleSpeech(persona, lang);
    try {
      await speakCoachText(spokenAdvice, interfaceMode, gender, lang, preparedAudio);
    } catch (error) {
      console.warn('Could not speak analysis advice.', error);
      setSpeechNotice(speechErrorText(lang, error));
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
  variant = 0,
) {
  const persona = coachPersona(interfaceMode, gender, lang, userAge);
  return personaAdvice(persona, lang, humanAdvice(report, lang, variant, audienceStyle(interfaceMode, userAge)));
}

function analysisCoachSpeech(
  report: MoveReport,
  interfaceMode: InterfaceMode,
  gender: Gender,
  lang: Lang,
  userAge?: number,
  variant = 0,
) {
  const persona = coachPersona(interfaceMode, gender, lang, userAge);
  return `${persona.name}: ${spokenHumanAdvice(report, lang, variant, audienceStyle(interfaceMode, userAge))}`;
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

type AudienceStyle = 'little' | 'kid' | 'teen' | 'adult';

function humanAdvice(report: MoveReport, lang: Lang, variant = 0, style: AudienceStyle = 'teen') {
  return naturalHumanAdvice(report, lang, variant, style);
}

function naturalHumanAdvice(report: MoveReport, lang: Lang, variant = 0, style: AudienceStyle = 'teen') {
  return variedWrittenAdvice(report, lang, variant, style);

  if (report.label === 'good') {
    if (lang === 'en') return 'Yeah, I like this move. It keeps your position steady and does not give away anything obvious. Now take one quick look at what your opponent may want next.';
    if (lang === 'kk') return 'Иә, маған бұл жүріс ұнайды. Позицияң тұрақты, артық ештеңе беріп тұрған жоқсың. Енді қарсылас келесіде не істей алатынын бір қарап ал.';
    return 'Да, мне нравится этот ход. Он спокойный: ты ничего лишнего не отдаёшь и держишь позицию под контролем. Теперь просто посмотри, что соперник может захотеть следующим ходом.';
  }
  if (lang === 'en') return `Here I would slow down a bit. After ${report.san}, your opponent gets a chance. ${report.bestMove} was cleaner. Before moving, quickly check checks, captures, and threats.`;
  if (lang === 'kk') return `Бұл жерде сәл сабырлырақ ойнаған дұрыс. ${report.san} кейін қарсыласта мүмкіндік пайда болады. ${report.bestMove} тазарақ еді. Жүріс жасамас бұрын шах, алу және қауіптерді тексер.`;
  return `Вот тут я бы чуть притормозил. После ${report.san} у соперника появляется шанс. Аккуратнее было ${report.bestMove}. Перед ходом быстро проверь шахи, взятия и угрозы.`;
}

function spokenHumanAdvice(report: MoveReport, lang: Lang, variant = 0, style: AudienceStyle = 'teen') {
  return variedSpokenAdvice(report, lang, variant, style);

  if (report.label === 'good') {
    if (lang === 'en') return 'Yeah, this is fine. I like it. You kept everything under control. Now just breathe for a second and check what your opponent wants next.';
    if (lang === 'kk') return 'Иә, жақсы. Маған ұнайды. Бәрі бақылауда. Енді бір сәт тоқтап, қарсылас не қалайтынын қарап ал.';
    return 'Да, нормально. Мне нравится. Ты тут всё держишь под контролем. Теперь просто на секунду остановись и посмотри, чего хочет соперник.';
  }
  if (lang === 'en') return `Okay, here I would stop for a moment. After ${report.san}, things get a little uncomfortable. ${report.bestMove} was the calmer move. Look for checks, captures, and threats first.`;
  if (lang === 'kk') return `Жақсы, мұнда бір сәт тоқтайық. ${report.san} кейін ойында қиындық пайда болады. ${report.bestMove} тынышырақ еді. Алдымен шах, алу және қауіптерді қарап ал.`;
  return `Так, вот здесь давай на секунду остановимся. После ${report.san} позиция становится чуть неприятной. Спокойнее было ${report.bestMove}. Сначала посмотри шахи, взятия и угрозы.`;
}

function variedWrittenAdvice(report: MoveReport, lang: Lang, variant = 0, style: AudienceStyle = 'teen') {
  if (report.label !== 'good') return variedProblemAdvice(report, lang, variant, style);
  const lines = writtenGoodLines(report, lang, style);
  return lines[lineIndex(report, lines.length, variant)];
}

function variedSpokenAdvice(report: MoveReport, lang: Lang, variant = 0, style: AudienceStyle = 'teen') {
  if (report.label !== 'good') return variedProblemSpeech(report, lang, variant, style);
  const lines = spokenGoodLines(report, lang, style);
  return lines[lineIndex(report, lines.length, variant)];
}

function writtenGoodLines(report: MoveReport, lang: Lang, style: AudienceStyle) {
  if (lang === 'ru') {
    if (style === 'little') return [
      'Класс, ход хороший. Фигурки стоят спокойно, ничего не теряем.',
      `${report.san} подходит. Давай просто посмотрим, не хочет ли соперник нас напугать.`,
      'Хорошо. Ты сделал спокойный ход, можно играть дальше.',
    ];
    if (style === 'kid') return [
      'Да, нормальный ход. Он держит позицию, и это сейчас главное.',
      `${report.san} выглядит по делу. Без паники, позиция живая.`,
      'Хорошо сыграно. Теперь как напарник скажу: проверь идею соперника.',
    ];
    if (style === 'teen') return [
      'Да, норм. Ход спокойный, позиция не разваливается.',
      `${report.san} выглядит адекватно. Не вау-ход, но по позиции всё окей.`,
      'Хорошее практическое решение. Без лишнего риска, можно продолжать.',
      'Мне нравится. Такой ход реально можно сыграть за доской.',
    ];
  }
  if (lang === 'en') return [
    'Yeah, I like this move. It keeps your position steady, and now you can calmly check what your opponent wants next.',
    `${report.san} looks sensible. Nothing dramatic, just a clean move that keeps the game under control.`,
    'Good practical choice. You did not force anything too early, and that is often exactly right.',
    'This is a normal human move: solid, calm, and close to what the position asks for.',
  ];
  if (lang === 'kk') return [
    'Иә, маған бұл жүріс ұнайды. Позиция тұрақты, енді қарсылас не қалайтынын қарап ал.',
    `${report.san} орынды көрінеді. Қауіпсіз, тыныш, ойынды бақылауда ұстап тұр.`,
    'Жақсы практикалық таңдау. Асықпадың, позицияны бұзбадың.',
    'Бұл тыныш әрі дұрыс жүріс. Қазір ең бастысы - қарсыластың идеясын түсіну.',
  ];
  return [
    'Да, мне нравится этот ход. Он спокойный: ты ничего лишнего не отдаёшь и держишь позицию под контролем.',
    `${report.san} выглядит нормально. Без лишней суеты, просто аккуратный ход по позиции.`,
    'Хорошее практическое решение. Ты не форсируешь события и оставляешь позицию здоровой.',
    'Вот это похоже на человеческий ход: спокойно, надёжно и без лишнего риска.',
  ];
}

function spokenGoodLines(report: MoveReport, lang: Lang, style: AudienceStyle) {
  if (lang === 'ru') {
    if (style === 'little') return [
      'Класс. Хороший ход. Фигурки в порядке, можно играть дальше.',
      'Да, так можно. Ты ничего не потерял. Теперь смотрим, что делает соперник.',
      'Хорошо. Спокойный ход. Мне нравится.',
    ];
    if (style === 'kid') return [
      'Да, нормально. Ты держишь позицию. Теперь глянь, что хочет соперник.',
      `${report.san}. Да, по делу. Просто и аккуратно.`,
      'Хорошо. Как напарник скажу: не спеши, проверь угрозы.',
    ];
    if (style === 'teen') return [
      'Да, норм. Мне нравится. Ход спокойный, позиция не сыпется.',
      `${report.san}. Логично. Не красота ради красоты, а просто здоровый ход.`,
      'Хорошо. Без лишнего риска. Теперь быстро проверь, что соперник хочет в ответ.',
      'Да, это похоже на ход живого игрока. Продолжай, только не спеши.',
    ];
  }
  if (lang === 'en') return [
    'Yeah, this is fine. I like it. You kept everything under control. Now just check what your opponent wants next.',
    `${report.san}. Yep, that makes sense. Nothing flashy, but it keeps the position healthy.`,
    'Good, this is a calm move. You are not giving anything away. Now take one more look at their threats.',
    'Nice. That is a very normal human decision here. Keep going, but do not rush the next move.',
  ];
  if (lang === 'kk') return [
    'Иә, жақсы. Маған ұнайды. Бәрі бақылауда. Енді қарсылас не қалайтынын қарап ал.',
    `${report.san}. Иә, бұл түсінікті. Ерекше емес, бірақ позицияны сақтап тұр.`,
    'Жақсы, бұл тыныш жүріс. Артық ештеңе беріп тұрған жоқсың. Енді қауіптерді қарап ал.',
    'Жақсы. Мұнда адамша дұрыс шешім. Келесі жүріске асықпа.',
  ];
  return [
    'Да, нормально. Мне нравится. Ты тут всё держишь под контролем. Теперь просто посмотри, чего хочет соперник.',
    `${report.san}. Да, логично. Не блестяще ради красоты, а просто здоровый ход по позиции.`,
    'Хорошо, это спокойный ход. Ты ничего не отдаёшь. Теперь ещё раз глянь, нет ли у соперника угроз.',
    'Нормально. Вот это уже похоже на человеческое решение за доской. Продолжай, только не спеши со следующим ходом.',
  ];
}

function variedProblemAdvice(report: MoveReport, lang: Lang, variant = 0, _style: AudienceStyle = 'teen') {
  const lines = lang === 'en'
    ? [
      `Here I would slow down. After ${report.san}, your opponent gets a chance. ${report.bestMove} was cleaner.`,
      `${report.san} is playable-looking, but it lets the position slip a bit. I would compare it with ${report.bestMove}.`,
      `This is the kind of moment where one quiet check helps. ${report.bestMove} kept things under better control.`,
    ]
    : lang === 'kk'
      ? [
        `Бұл жерде біраз тоқтаған дұрыс. ${report.san} кейін қарсыласта мүмкіндік пайда болады. ${report.bestMove} тазарақ еді.`,
        `${report.san} ойналатындай көрінеді, бірақ позиция аздап нашарлайды. ${report.bestMove} жүрісімен салыстыр.`,
        `Мұндай сәтте бір рет тексеріп алған жақсы. ${report.bestMove} позицияны жақсырақ ұстап тұрады.`,
      ]
      : [
        `Вот тут я бы чуть притормозил. После ${report.san} у соперника появляется шанс. Аккуратнее было ${report.bestMove}.`,
        `${report.san} выглядит играбельно, но позиция немного проседает. Я бы сравнил с вариантом ${report.bestMove}.`,
        `Это момент, где лучше один раз спокойно перепроверить. ${report.bestMove} держало позицию увереннее.`,
      ];
  return lines[lineIndex(report, lines.length, variant)];
}

function variedProblemSpeech(report: MoveReport, lang: Lang, variant = 0, _style: AudienceStyle = 'teen') {
  const lines = lang === 'en'
    ? [
      `Okay, here I would stop for a moment. After ${report.san}, things get a little uncomfortable. ${report.bestMove} was calmer.`,
      `Hmm, ${report.san} is not crazy, but it gives your opponent something to use. I would look at ${report.bestMove} first.`,
      `Wait a second here. Before playing ${report.san}, check the forcing moves. ${report.bestMove} kept more control.`,
    ]
    : lang === 'kk'
      ? [
        `Жақсы, мұнда бір сәт тоқтайық. ${report.san} кейін ойында қиындық пайда болады. ${report.bestMove} тынышырақ еді.`,
        `${report.san} өте жаман емес, бірақ қарсыласқа мүмкіндік береді. Мен алдымен ${report.bestMove} қарар едім.`,
        `Бір сәт тоқта. ${report.san} алдында мәжбүрлейтін жүрістерді тексер. ${report.bestMove} бақылауды көбірек сақтайды.`,
      ]
      : [
        `Так, вот здесь давай на секунду остановимся. После ${report.san} позиция становится чуть неприятной. Спокойнее было ${report.bestMove}.`,
        `Смотри, ${report.san} не выглядит ужасно, но сопернику появляется за что зацепиться. Я бы сначала посмотрел ${report.bestMove}.`,
        `Подожди секунду. Перед ${report.san} стоило проверить форсированные ходы. ${report.bestMove} держало больше контроля.`,
      ];
  return lines[lineIndex(report, lines.length, variant)];
}

function lineIndex(report: MoveReport, length: number, variant = 0) {
  const seed = [...report.san].reduce((sum, char) => sum + char.charCodeAt(0), report.ply + report.moveNumber);
  return (seed + variant) % length;
}

function audienceStyle(interfaceMode: InterfaceMode, userAge?: number): AudienceStyle {
  if (interfaceMode === 'child' || (typeof userAge === 'number' && userAge < 6)) return 'little';
  if (interfaceMode === 'preschool' || (typeof userAge === 'number' && userAge < 12)) return 'kid';
  if (typeof userAge === 'number' && userAge < 18) return 'teen';
  return 'adult';
}

function idleAdvice(persona: ReturnType<typeof coachPersona>, lang: Lang) {
  if (lang === 'en') return personaIntro(persona, lang, 'Pick a move from the table, and I will explain it in simple words.');
  if (lang === 'kk') return personaIntro(persona, lang, 'Кестеден жүрісті таңда, мен оны қарапайым тілмен түсіндіремін.');
  return personaIntro(persona, lang, 'Выбери ход в таблице, и я объясню его простыми словами.');
}

function idleSpeech(persona: ReturnType<typeof coachPersona>, lang: Lang) {
  if (lang === 'en') return `${persona.name}: Hi, I am ${persona.name}. Pick any move from the table and I will explain it like we are looking at the board together.`;
  if (lang === 'kk') return `${persona.name}: Сәлем, мен ${persona.name}. Кестеден кез келген жүрісті таңда, мен оны тақтаға бірге қарап отырғандай түсіндіремін.`;
  return `${persona.name}: Привет, я ${persona.name}. Выбери любой ход из таблицы, и я объясню его так, будто мы вместе смотрим на доску.`;
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
