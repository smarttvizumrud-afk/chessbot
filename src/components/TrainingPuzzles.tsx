import { Link } from 'wouter';
import { labelText, localizeInsight } from '../lib/i18n';
import type { Lang, MoveReport, StoredAnalysis, StoredGame } from '../lib/types';

type Props = { games: StoredGame[]; analyses: StoredAnalysis[]; lang: Lang };

type Puzzle = {
  id: string;
  gameId: string;
  opponent: string;
  opening: string;
  report: MoveReport;
};

type ThemeGroup = {
  theme: string;
  score: number;
  puzzles: Puzzle[];
};

type PuzzleText = {
  title: string;
  empty: string;
  best: string;
  open: string;
  move: string;
  positions: string;
};

const text: Record<Lang, PuzzleText> = {
  ru: {
    title: '\u0417\u0430\u0434\u0430\u0447\u0438 \u043f\u043e \u0442\u0432\u043e\u0438\u043c \u0442\u0435\u043c\u0430\u043c',
    empty: '\u041f\u043e\u043a\u0430 \u043d\u0435\u0442 \u0442\u0432\u043e\u0438\u0445 \u043e\u0448\u0438\u0431\u043e\u043a \u0434\u043b\u044f \u0437\u0430\u0434\u0430\u0447. \u0417\u0430\u0433\u0440\u0443\u0437\u0438 \u0438 \u043f\u0440\u043e\u0430\u043d\u0430\u043b\u0438\u0437\u0438\u0440\u0443\u0439 \u043f\u0430\u0440\u0442\u0438\u0438.',
    best: '\u041b\u0443\u0447\u0448\u0438\u0439 \u0445\u043e\u0434',
    open: '\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u043f\u0430\u0440\u0442\u0438\u044e',
    move: '\u0422\u0432\u043e\u0439 \u0445\u043e\u0434',
    positions: '\u043f\u043e\u0437\u0438\u0446\u0438\u0439',
  },
  en: {
    title: 'Puzzles by your themes',
    empty: 'No personal mistakes for puzzles yet. Import and analyse games first.',
    best: 'Best move',
    open: 'Open game',
    move: 'Your move',
    positions: 'positions',
  },
  kk: {
    title: '\u0422\u0430\u049b\u044b\u0440\u044b\u043f\u0442\u0430\u0440\u044b\u04a3 \u0431\u043e\u0439\u044b\u043d\u0448\u0430 \u0435\u0441\u0435\u043f\u0442\u0435\u0440',
    empty: '\u04d8\u0437\u0456\u0440\u0433\u0435 \u0436\u0435\u043a\u0435 \u049b\u0430\u0442\u0435\u043b\u0435\u0440\u0456\u04a3\u043d\u0435\u043d \u0435\u0441\u0435\u043f \u0436\u043e\u049b. \u041f\u0430\u0440\u0442\u0438\u044f\u043b\u0430\u0440\u0434\u044b \u0436\u04af\u043a\u0442\u0435\u043f, \u0442\u0430\u043b\u0434\u0430.',
    best: '\u0415\u04a3 \u0436\u0430\u049b\u0441\u044b \u0436\u04af\u0440\u0456\u0441',
    open: '\u041f\u0430\u0440\u0442\u0438\u044f\u043d\u044b \u0430\u0448\u0443',
    move: '\u0421\u0435\u043d\u0456\u04a3 \u0436\u04af\u0440\u0456\u0441\u0456\u04a3',
    positions: '\u043f\u043e\u0437\u0438\u0446\u0438\u044f',
  },
};

const severity: Record<MoveReport['label'], number> = {
  good: 0,
  inaccuracy: 1,
  mistake: 2,
  blunder: 3,
};

export function TrainingPuzzles({ games, analyses, lang }: Props) {
  const labels = text[lang];
  const groups = buildThemeGroups(games, analyses);

  return (
    <section className="panel" id="puzzles">
      <h2>{labels.title}</h2>
      {!groups.length && <p>{labels.empty}</p>}
      <div className="theme-puzzle-list">
        {groups.map((group) => (
          <article className="theme-puzzle-group" key={group.theme}>
            <header>
              <h3>{localizeInsight(group.theme, lang)}</h3>
              <span>{group.puzzles.length} {labels.positions}</span>
            </header>
            <div className="puzzle-grid">
              {group.puzzles.map((puzzle) => <PuzzleCard key={puzzle.id} puzzle={puzzle} labels={labels} lang={lang} />)}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PuzzleCard({ puzzle, labels, lang }: { puzzle: Puzzle; labels: PuzzleText; lang: Lang }) {
  return (
    <article className={`puzzle-card ${puzzle.report.label}`}>
      <span className="puzzle-badge">{labelText(lang, puzzle.report.label)}</span>
      <h4>{puzzle.opening}</h4>
      <p>{labels.move}: {puzzle.report.moveNumber}. {puzzle.report.san}</p>
      <p>{labels.best}: <strong>{puzzle.report.bestMove}</strong></p>
      <small>{puzzle.opponent}</small>
      <Link href={`/game/${puzzle.gameId}`} className="account-link secondary">{labels.open}</Link>
    </article>
  );
}

function buildThemeGroups(games: StoredGame[], analyses: StoredAnalysis[]): ThemeGroup[] {
  const byGame = new Map(games.map((game) => [game.id, game]));
  const groups = new Map<string, ThemeGroup>();

  analyses
    .flatMap((analysis) => analysis.moveReports.map((report) => ({ analysis, report })))
    .filter(({ report }) => report.side === 'player' && report.label !== 'good')
    .forEach(({ analysis, report }) => {
      const theme = report.theme || 'calculation discipline';
      const group = groups.get(theme) ?? { theme, score: 0, puzzles: [] };
      const game = byGame.get(analysis.gameId);
      group.score += severity[report.label] * 100 + Math.max(0, report.loss);
      group.puzzles.push({
        id: `${analysis.id}-${report.ply}`,
        gameId: analysis.gameId,
        opponent: game?.opponent ?? '',
        opening: game?.opening || 'Opening',
        report,
      });
      groups.set(theme, group);
    });

  return [...groups.values()]
    .map(limitGroupPuzzles)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function limitGroupPuzzles(group: ThemeGroup): ThemeGroup {
  return {
    ...group,
    puzzles: group.puzzles
      .sort((a, b) => severity[b.report.label] - severity[a.report.label] || b.report.loss - a.report.loss)
      .slice(0, 3),
  };
}
