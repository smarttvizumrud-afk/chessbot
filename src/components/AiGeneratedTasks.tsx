import { Link } from 'wouter';
import { NotEnoughCreditsError } from '../lib/credits';
import { generateAiTrainingTasks, type AiTrainingTask } from '../lib/aiTrainingTasks';
import type { Lang, StoredAnalysis, StoredGame } from '../lib/types';
import { useState } from 'react';

type Props = { games: StoredGame[]; analyses: StoredAnalysis[]; lang: Lang };

const text: Record<Lang, {
  title: string;
  text: string;
  action: string;
  loading: string;
  error: string;
  noAnalyses: string;
  buyCredits: string;
  open: string;
}> = {
  ru: {
    title: 'AI-задачи от Gemini',
    text: 'Gemini соберёт короткие задания по твоим партиям, зевкам и дебютам.',
    action: 'Сгенерировать задачи',
    loading: 'Генерирую...',
    error: 'Не получилось сгенерировать задачи. Проверь AI-функцию Gemini в Supabase.',
    noAnalyses: 'Сначала загрузи и проанализируй хотя бы одну партию.',
    buyCredits: 'Купить кредиты',
    open: 'Открыть партию',
  },
  en: {
    title: 'AI tasks from Gemini',
    text: 'Gemini will create short tasks from your games, blunders, and openings.',
    action: 'Generate tasks',
    loading: 'Generating...',
    error: 'Could not generate tasks. Check the Gemini secret in Supabase.',
    noAnalyses: 'Import and analyse at least one game first.',
    buyCredits: 'Buy credits',
    open: 'Open game',
  },
  kk: {
    title: 'Gemini AI есептері',
    text: 'Gemini партияларың, қателерің және дебюттерің бойынша қысқа есептер жасайды.',
    action: 'Есептер жасау',
    loading: 'Жасалып жатыр...',
    error: 'Есептер жасалмады. Supabase ішіндегі Gemini құпиясын тексер.',
    noAnalyses: 'Aldymen keminde bir partiany juktep, talda.',
    buyCredits: 'Kredit alu',
    open: 'Партияны ашу',
  },
};

export function AiGeneratedTasks({ games, analyses, lang }: Props) {
  const labels = text[lang];
  const [tasks, setTasks] = useState<AiTrainingTask[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [needsCredits, setNeedsCredits] = useState(false);

  async function handleGenerate() {
    setBusy(true);
    setError('');
    setNeedsCredits(false);
    try {
      setTasks(await generateAiTrainingTasks(games, analyses, lang));
    } catch (error) {
      if (error instanceof NotEnoughCreditsError) {
        setNeedsCredits(true);
        setError(noCreditsText(lang));
      } else {
        console.warn('Could not generate AI training tasks.', error);
        setError(labels.error);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel generated-tasks">
      <div className="task-header">
        <div>
          <h2>{labels.title}</h2>
          <p>{labels.text}</p>
        </div>
        <button type="button" onClick={handleGenerate} disabled={busy || !analyses.length}>
          {busy ? labels.loading : labels.action}
        </button>
      </div>
      {!analyses.length && <p className="message">{labels.noAnalyses}</p>}
      {error && <p className="message">{error}</p>}
      {needsCredits && <Link href="/pricing" className="account-link">{labels.buyCredits}</Link>}
      <div className="generated-task-grid">
        {tasks.map((task, index) => <AiTaskCard key={`${task.title}-${index}`} task={task} open={labels.open} />)}
      </div>
    </section>
  );
}

function noCreditsText(lang: Lang) {
  if (lang === 'en') return 'Credits are empty. Two AI tasks cost 1 credit.';
  if (lang === 'kk') return 'Kreditter bittti. Eki AI tapsyrma 1 kredit turady.';
  return 'Кредиты закончились. Две AI-задачи стоят 1 кредит.';
}

function AiTaskCard({ task, open }: { task: AiTrainingTask; open: string }) {
  return (
    <article className="generated-task ai-task">
      <span>{task.focus}</span>
      <h3>{task.title}</h3>
      <p>{task.instruction}</p>
      {task.gameId && <Link href={`/game/${task.gameId}`} className="account-link secondary">{open}</Link>}
    </article>
  );
}
