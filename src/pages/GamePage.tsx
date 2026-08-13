import { useEffect, useMemo, useState } from 'react';
import { AuthGate } from '../components/AuthGate';
import { AnalysisBoard } from '../components/AnalysisBoard';
import { MoveTable } from '../components/MoveTable';
import { labelText, localizeInsight, t } from '../lib/i18n';
import { fenAfterPly, getMovesWithFens } from '../lib/pgn';
import type { Lang, MoveReport, PieceStyle, PlayerColor } from '../lib/types';
import { useChessData } from '../lib/useChessData';

export function GamePage({ id, lang, pieceStyle }: { id: string; lang: Lang; pieceStyle: PieceStyle }) {
  return (
    <AuthGate lang={lang}>
      <GameContent id={id} lang={lang} pieceStyle={pieceStyle} />
    </AuthGate>
  );
}

function GameContent({ id, lang, pieceStyle }: { id: string; lang: Lang; pieceStyle: PieceStyle }) {
  const { games, analyses, loading } = useChessData();
  const game = games.find((item) => item.id === id);
  const analysis = analyses.find((item) => item.gameId === id);
  const [ply, setPly] = useState(0);
  const report = analysis?.moveReports.find((item) => item.ply === ply);
  const totalPly = useMemo(() => game ? getMovesWithFens(game.pgn).length : 0, [game]);
  const fen = useMemo(() => game ? fenAfterPly(game.pgn, ply) : '', [game, ply]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      setPly((currentPly) => event.key === 'ArrowLeft'
        ? Math.max(currentPly - 1, 0)
        : Math.min(currentPly + 1, totalPly));
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalPly]);

  if (loading) return <section className="panel">{t(lang, 'loading')}</section>;
  if (!game || !analysis || !fen) return <section className="panel">{t(lang, 'notFound')}</section>;

  return (
    <div className="analysis-layout">
      <section className="board-panel">
        <AnalysisBoard fen={fen} pieceStyle={pieceStyle} />
      </section>
      <section className="panel">
        <h1>{t(lang, 'gameAnalysis')}</h1>
        <p>{game.username} {t(lang, 'versus')} {game.opponent} · {analysis.accuracy}% {t(lang, 'accuracy').toLowerCase()}</p>
        <MoveTable reports={analysis.moveReports} selectedPly={ply} lang={lang} onSelect={setPly} />
        {report && <MoveComment report={report} playerColor={game.color} lang={lang} />}
      </section>
    </div>
  );
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
