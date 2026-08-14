import { Link } from 'wouter';
import { labelText, localizeInsight } from '../lib/i18n';
import { buildTrainingSections, type TrainingTask } from '../lib/trainingTasks';
import type { Lang, StoredAnalysis, StoredGame } from '../lib/types';

type Props = { games: StoredGame[]; analyses: StoredAnalysis[]; lang: Lang };

type Labels = {
  empty: string;
  move: string;
  best: string;
  open: string;
  reviewOpening: string;
  sections: Array<{ key: 'blunders' | 'games' | 'openings'; title: string; empty: string }>;
};

const text: Record<Lang, Labels> = {
  ru: {
    empty: 'Пока нет данных для задач. Загрузи и проанализируй партии.',
    move: 'Твой ход',
    best: 'Лучший ход',
    open: 'Открыть',
    reviewOpening: 'Повтори идеи этого дебюта по своей партии.',
    sections: [
      { key: 'blunders', title: 'Задачи по зевкам', empty: 'Зевков в анализе пока нет.' },
      { key: 'games', title: 'Задачи по партиям', empty: 'Сначала проанализируй несколько партий.' },
      { key: 'openings', title: 'Задачи по моим дебютам', empty: 'Дебюты появятся после импорта партий.' },
    ],
  },
  en: {
    empty: 'No training data yet. Import and analyse games first.',
    move: 'Your move',
    best: 'Best move',
    open: 'Open',
    reviewOpening: 'Review the ideas in this opening from your own game.',
    sections: [
      { key: 'blunders', title: 'Blunder tasks', empty: 'No blunders in analysis yet.' },
      { key: 'games', title: 'Game tasks', empty: 'Analyse a few games first.' },
      { key: 'openings', title: 'My opening tasks', empty: 'Openings appear after importing games.' },
    ],
  },
  kk: {
    empty: 'Әзірге жаттығу деректері жоқ. Алдымен партияларды талда.',
    move: 'Сенің жүрісің',
    best: 'Ең жақсы жүріс',
    open: 'Ашу',
    reviewOpening: 'Өз партияңдағы осы дебют идеяларын қайтала.',
    sections: [
      { key: 'blunders', title: 'Өрескел қателер', empty: 'Талдауда әзірге өрескел қате жоқ.' },
      { key: 'games', title: 'Партиялар бойынша есептер', empty: 'Алдымен бірнеше партияны талда.' },
      { key: 'openings', title: 'Менің дебюттерім', empty: 'Дебюттер партия импортынан кейін шығады.' },
    ],
  },
};

export function GeneratedTasks({ games, analyses, lang }: Props) {
  const labels = text[lang];
  const sections = buildTrainingSections(games, analyses);
  const hasTasks = labels.sections.some((section) => sections[section.key].length);

  return (
    <section className="panel generated-tasks">
      {!hasTasks && <p>{labels.empty}</p>}
      {labels.sections.map((section) => (
        <TaskSection
          key={section.key}
          title={section.title}
          empty={section.empty}
          tasks={sections[section.key]}
          labels={labels}
          lang={lang}
        />
      ))}
    </section>
  );
}

function TaskSection({
  title,
  empty,
  tasks,
  labels,
  lang,
}: {
  title: string;
  empty: string;
  tasks: TrainingTask[];
  labels: Labels;
  lang: Lang;
}) {
  return (
    <div className="task-section">
      <h2>{title}</h2>
      {!tasks.length && <p>{empty}</p>}
      <div className="generated-task-grid">
        {tasks.map((task) => <TaskCard key={task.id} task={task} labels={labels} lang={lang} />)}
      </div>
    </div>
  );
}

function TaskCard({ task, labels, lang }: { task: TrainingTask; labels: Labels; lang: Lang }) {
  const report = task.report;
  const className = report ? `generated-task ${report.label}` : 'generated-task';

  return (
    <article className={className}>
      <span>{report ? labelText(lang, report.label) : task.opening}</span>
      <h3>{report ? localizeInsight(report.theme, lang) : task.opening}</h3>
      <p>{task.opening} · {task.opponent}</p>
      {report ? (
        <>
          <p>{labels.move}: {report.san}</p>
          <p>{labels.best}: <strong>{report.bestMove}</strong></p>
        </>
      ) : <p>{labels.reviewOpening}</p>}
      <Link href={`/game/${task.gameId}`} className="account-link secondary">{labels.open}</Link>
    </article>
  );
}
