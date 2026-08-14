import { Link } from 'wouter';
import { AuthGate } from '../components/AuthGate';
import { GeneratedTasks } from '../components/GeneratedTasks';
import type { Lang } from '../lib/types';
import { useChessData } from '../lib/useChessData';

type TrainingText = {
  title: string;
  subtitle: string;
  puzzles: string;
  puzzlesText: string;
  openings: string;
  openingsText: string;
  startPuzzles: string;
  studyOpenings: string;
};

const text: Record<Lang, TrainingText> = {
  ru: {
    title: '\u0422\u0440\u0435\u043d\u0438\u0440\u043e\u0432\u043a\u0430',
    subtitle: '\u0417\u0430\u0434\u0430\u0447\u0438 \u0438 \u0434\u0435\u0431\u044e\u0442\u044b \u0438\u0437 \u0442\u0432\u043e\u0438\u0445 \u043f\u0430\u0440\u0442\u0438\u0439.',
    puzzles: '\u0417\u0430\u0434\u0430\u0447\u0438',
    puzzlesText: '\u0422\u0435\u043c\u044b, \u0433\u0434\u0435 \u0432 \u0430\u043d\u0430\u043b\u0438\u0437\u0435 \u0431\u044b\u043b\u043e \u0431\u043e\u043b\u044c\u0448\u0435 \u0432\u0441\u0435\u0433\u043e \u043e\u0448\u0438\u0431\u043e\u043a.',
    openings: '\u0418\u0437\u0443\u0447\u0435\u043d\u0438\u0435 \u0434\u0435\u0431\u044e\u0442\u043e\u0432',
    openingsText: '\u041f\u043e\u0441\u043c\u043e\u0442\u0440\u0438, \u043a\u0430\u043a\u0438\u0435 \u0434\u0435\u0431\u044e\u0442\u044b \u0434\u0430\u044e\u0442 \u043b\u0443\u0447\u0448\u0438\u0439 \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442.',
    startPuzzles: '\u041d\u0430\u0447\u0430\u0442\u044c \u0437\u0430\u0434\u0430\u0447\u0438',
    studyOpenings: '\u0418\u0437\u0443\u0447\u0430\u0442\u044c \u0434\u0435\u0431\u044e\u0442\u044b',
  },
  en: {
    title: 'Training',
    subtitle: 'Puzzles and opening study from your own games.',
    puzzles: 'Puzzles',
    puzzlesText: 'Themes where your analysis found the most mistakes.',
    openings: 'Opening study',
    openingsText: 'See which openings give you the best results.',
    startPuzzles: 'Start puzzles',
    studyOpenings: 'Study openings',
  },
  kk: {
    title: '\u0416\u0430\u0442\u0442\u044b\u0493\u0443',
    subtitle: '\u041f\u0430\u0440\u0442\u0438\u044f\u043b\u0430\u0440\u044b\u04a3\u043d\u0430\u043d \u0435\u0441\u0435\u043f\u0442\u0435\u0440 \u0436\u04d9\u043d\u0435 \u0434\u0435\u0431\u044e\u0442\u0442\u0435\u0440.',
    puzzles: '\u0415\u0441\u0435\u043f\u0442\u0435\u0440',
    puzzlesText: '\u0422\u0430\u043b\u0434\u0430\u0443\u0434\u0430 \u0435\u04a3 \u043a\u04e9\u043f \u049b\u0430\u0442\u0435 \u0448\u044b\u049b\u049b\u0430\u043d \u0442\u0430\u049b\u044b\u0440\u044b\u043f\u0442\u0430\u0440.',
    openings: '\u0414\u0435\u0431\u044e\u0442\u0442\u0435\u0440\u0434\u0456 \u04af\u0439\u0440\u0435\u043d\u0443',
    openingsText: '\u049a\u0430\u0439 \u0434\u0435\u0431\u044e\u0442 \u0436\u0430\u049b\u0441\u044b \u043d\u04d9\u0442\u0438\u0436\u0435 \u0431\u0435\u0440\u0435\u0442\u0456\u043d\u0456\u043d \u043a\u04e9\u0440.',
    startPuzzles: '\u0415\u0441\u0435\u043f\u0442\u0435\u0440\u0434\u0456 \u0431\u0430\u0441\u0442\u0430\u0443',
    studyOpenings: '\u0414\u0435\u0431\u044e\u0442\u0442\u0435\u0440',
  },
};

export function TrainingPage({ lang }: { lang: Lang }) {
  return (
    <AuthGate lang={lang}>
      <TrainingContent lang={lang} />
    </AuthGate>
  );
}

function TrainingContent({ lang }: { lang: Lang }) {
  const { games, analyses, loading } = useChessData();
  const labels = text[lang];

  return (
    <div className="page-grid">
      <section className="panel training-hero">
        <h1>{labels.title}</h1>
        <p>{labels.subtitle}</p>
      </section>
      <section className="training-grid">
        <TrainingCard title={labels.puzzles} text={labels.puzzlesText} action={labels.startPuzzles} />
        <TrainingCard title={labels.openings} text={labels.openingsText} action={labels.studyOpenings} href="/openings" />
      </section>
      {loading
        ? <section className="panel"><p>Loading...</p></section>
        : <GeneratedTasks games={games} analyses={analyses} lang={lang} />}
    </div>
  );
}

function TrainingCard({
  title,
  text,
  action,
  href,
}: {
  title: string;
  text: string;
  action: string;
  href?: string;
}) {
  return (
    <article className="training-card">
      <h2>{title}</h2>
      <p>{text}</p>
      {href
        ? <Link href={href} className="account-link">{action}</Link>
        : <span className="account-link secondary">{action}</span>}
    </article>
  );
}
