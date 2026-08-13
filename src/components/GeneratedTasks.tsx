import { Link } from 'wouter';
import { labelText, localizeInsight } from '../lib/i18n';
import type { Lang, MoveReport, StoredAnalysis, StoredGame } from '../lib/types';

type Props = { games: StoredGame[]; analyses: StoredAnalysis[]; lang: Lang };
type Task = { id: string; gameId: string; opening: string; opponent: string; report: MoveReport };

const text: Record<Lang, { title: string; empty: string; move: string; best: string; open: string }> = {
  ru: {
    title: '\u0417\u0430\u0434\u0430\u0447\u0438 \u0438\u0437 \u043f\u043e\u0441\u043b\u0435\u0434\u043d\u0438\u0445 \u043f\u0430\u0440\u0442\u0438\u0439',
    empty: '\u041f\u043e\u043a\u0430 \u043d\u0435\u0442 \u043e\u0448\u0438\u0431\u043e\u043a \u0434\u043b\u044f \u0437\u0430\u0434\u0430\u0447. \u0417\u0430\u0433\u0440\u0443\u0437\u0438 \u0438 \u043f\u0440\u043e\u0430\u043d\u0430\u043b\u0438\u0437\u0438\u0440\u0443\u0439 \u043f\u0430\u0440\u0442\u0438\u0438.',
    move: '\u0422\u0432\u043e\u0439 \u0445\u043e\u0434',
    best: '\u041b\u0443\u0447\u0448\u0438\u0439 \u0445\u043e\u0434',
    open: '\u041e\u0442\u043a\u0440\u044b\u0442\u044c',
  },
  en: { title: 'Tasks from recent games', empty: 'No mistakes for tasks yet.', move: 'Your move', best: 'Best move', open: 'Open' },
  kk: {
    title: '\u0421\u043e\u04a3\u0493\u044b \u043f\u0430\u0440\u0442\u0438\u044f\u043b\u0430\u0440\u0434\u0430\u043d \u0435\u0441\u0435\u043f\u0442\u0435\u0440',
    empty: '\u04d8\u0437\u0456\u0440\u0433\u0435 \u049b\u0430\u0442\u0435\u043b\u0435\u0440 \u0436\u043e\u049b.',
    move: '\u0421\u0435\u043d\u0456\u04a3 \u0436\u04af\u0440\u0456\u0441\u0456\u04a3',
    best: '\u0415\u04a3 \u0436\u0430\u049b\u0441\u044b \u0436\u04af\u0440\u0456\u0441',
    open: '\u0410\u0448\u0443',
  },
};

const severity: Record<MoveReport['label'], number> = { good: 0, inaccuracy: 1, mistake: 2, blunder: 3 };

export function GeneratedTasks({ games, analyses, lang }: Props) {
  const labels = text[lang];
  const tasks = buildRecentTasks(games, analyses);

  return (
    <section className="panel generated-tasks">
      <h2>{labels.title}</h2>
      {!tasks.length && <p>{labels.empty}</p>}
      <div className="generated-task-grid">
        {tasks.map((task) => (
          <article className={`generated-task ${task.report.label}`} key={task.id}>
            <span>{labelText(lang, task.report.label)}</span>
            <h3>{localizeInsight(task.report.theme, lang)}</h3>
            <p>{task.opening} · {task.opponent}</p>
            <p>{labels.move}: {task.report.san}</p>
            <p>{labels.best}: <strong>{task.report.bestMove}</strong></p>
            <Link href={`/game/${task.gameId}`} className="account-link secondary">{labels.open}</Link>
          </article>
        ))}
      </div>
    </section>
  );
}

function buildRecentTasks(games: StoredGame[], analyses: StoredAnalysis[]): Task[] {
  const recentGames = games.slice(0, 10);
  const byAnalysis = new Map(analyses.map((analysis) => [analysis.gameId, analysis]));
  return recentGames
    .flatMap((game) => buildGameTasks(game, byAnalysis.get(game.id)))
    .sort((a, b) => severity[b.report.label] - severity[a.report.label] || b.report.loss - a.report.loss)
    .slice(0, 12);
}

function buildGameTasks(game: StoredGame, analysis?: StoredAnalysis): Task[] {
  if (!analysis) return [];
  return analysis.moveReports
    .filter((report) => report.side === 'player' && report.label !== 'good')
    .map((report) => ({
      id: `${analysis.id}-${report.ply}`,
      gameId: game.id,
      opening: game.opening,
      opponent: game.opponent,
      report,
    }));
}
