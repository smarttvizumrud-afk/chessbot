import { useState } from 'react';
import { AuthGate } from '../components/AuthGate';
import { askCoach } from '../lib/aiCoach';
import { t } from '../lib/i18n';
import type { Lang } from '../lib/types';
import { useChessData } from '../lib/useChessData';

export function CoachPage({ lang }: { lang: Lang }) {
  return (
    <AuthGate lang={lang}>
      <CoachContent lang={lang} />
    </AuthGate>
  );
}

function CoachContent({ lang }: { lang: Lang }) {
  const { games, analyses } = useChessData();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setAnswer(await askCoach(question, lang, games, analyses));
    setBusy(false);
  }

  return (
    <section className="panel coach-panel">
      <h1>{t(lang, 'coach')}</h1>
      <form className="coach-form" onSubmit={submit}>
        <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={t(lang, 'ask')} required />
        <button disabled={busy}>{busy ? '...' : t(lang, 'send')}</button>
      </form>
      {answer && <p className="coach-answer">{answer}</p>}
    </section>
  );
}
