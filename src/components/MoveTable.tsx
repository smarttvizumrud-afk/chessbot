import { labelText } from '../lib/i18n';
import type { Lang, MoveReport } from '../lib/types';

type Props = {
  reports: MoveReport[];
  selectedPly: number;
  lang: Lang;
  onSelect: (ply: number) => void;
};

type MovePair = {
  moveNumber: number;
  white?: MoveReport;
  black?: MoveReport;
};

export function MoveTable({ reports, selectedPly, lang, onSelect }: Props) {
  const pairs = pairMoves(reports);
  const selectedReport = reports.find((report) => report.ply === selectedPly);

  return (
    <div className="move-table">
      <div className="move-table-head">
        <strong>{selectedReport ? formatEval(selectedReport.playedEval) : '-'}</strong>
        <span>Stockfish</span>
      </div>
      {pairs.map((pair) => (
        <div className="move-pair" key={pair.moveNumber}>
          <span className="move-number">{pair.moveNumber}</span>
          <MoveCell report={pair.white} selectedPly={selectedPly} onSelect={onSelect} />
          <MoveEval report={pair.white} />
          <MoveCell report={pair.black} selectedPly={selectedPly} onSelect={onSelect} />
          <MoveEval report={pair.black} />
          {pair.white && pair.white.label !== 'good' && (
            <MoveNote report={pair.white} lang={lang} onSelect={onSelect} />
          )}
          {pair.black && pair.black.label !== 'good' && (
            <MoveNote report={pair.black} lang={lang} onSelect={onSelect} />
          )}
        </div>
      ))}
    </div>
  );
}

function MoveCell({
  report,
  selectedPly,
  onSelect,
}: {
  report?: MoveReport;
  selectedPly: number;
  onSelect: (ply: number) => void;
}) {
  if (!report) return <span className="move-empty">...</span>;
  return (
    <button
      className={`move-cell ${report.label} ${report.ply === selectedPly ? 'selected' : ''}`}
      type="button"
      onClick={() => onSelect(report.ply)}
    >
      {report.san}{suffixFor(report.label)}
    </button>
  );
}

function MoveEval({ report }: { report?: MoveReport }) {
  return <span className="move-eval">{report ? formatEval(report.playedEval) : ''}</span>;
}

function MoveNote({ report, lang, onSelect }: { report: MoveReport; lang: Lang; onSelect: (ply: number) => void }) {
  return (
    <button className={`move-note ${report.label}`} type="button" onClick={() => onSelect(report.ply)}>
      {labelText(lang, report.label)}. {report.bestMove} {bestText(lang)}
    </button>
  );
}

function pairMoves(reports: MoveReport[]) {
  const pairs = new Map<number, MovePair>();
  reports.forEach((report) => {
    const pair = pairs.get(report.moveNumber) ?? { moveNumber: report.moveNumber };
    if (report.ply % 2 === 1) pair.white = report;
    else pair.black = report;
    pairs.set(report.moveNumber, pair);
  });
  return [...pairs.values()].sort((a, b) => a.moveNumber - b.moveNumber);
}

function formatEval(value: number) {
  if (Math.abs(value) >= 900) return `#${Math.max(1, Math.round(Math.abs(value) / 1000))}`;
  const pawns = value / 100;
  if (Math.abs(pawns) < 0.05) return '0.0';
  return `${pawns > 0 ? '+' : ''}${pawns.toFixed(1)}`;
}

function suffixFor(label: MoveReport['label']) {
  if (label === 'blunder') return '??';
  if (label === 'mistake') return '?';
  if (label === 'inaccuracy') return '?!';
  return '';
}

function bestText(lang: Lang) {
  if (lang === 'en') return 'was best.';
  if (lang === 'kk') return '\u0435\u04a3 \u0436\u0430\u049b\u0441\u044b \u0435\u0434\u0456.';
  return '\u0431\u044b\u043b \u043b\u0443\u0447\u0448\u0438\u043c.';
}
