import { useState } from 'react';
import { AuthGate } from '../components/AuthGate';
import { askCoach, type CoachMessage } from '../lib/aiCoach';
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
  const [messages, setMessages] = useState<CoachMessage[]>(() => [welcomeMessage(lang)]);
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const text = question.trim();
    if (!text || busy) return;

    const nextMessages: CoachMessage[] = [...messages, { role: 'user', text }];
    setMessages(nextMessages);
    setQuestion('');
    setBusy(true);
    const answer = await askCoach(text, lang, games, analyses, nextMessages);
    const assistantMessages = messages.filter((message) => message.role === 'assistant');
    const lastAnswer = assistantMessages[assistantMessages.length - 1]?.text;
    setMessages(lastAnswer === answer ? nextMessages : [...nextMessages, { role: 'assistant', text: answer }]);
    setBusy(false);
  }

  return (
    <section className="panel coach-panel">
      <h1>{t(lang, 'coach')}</h1>
      <div className="chat-window">
        {messages.map((message, index) => (
          <article className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>
            <span>{message.role === 'user' ? t(lang, 'you') : t(lang, 'coach')}</span>
            <p>{message.text}</p>
          </article>
        ))}
        {busy && (
          <article className="chat-message assistant">
            <span>{t(lang, 'coach')}</span>
            <p>{t(lang, 'coachTyping')}</p>
          </article>
        )}
      </div>
      <form className="chat-form" onSubmit={submit}>
        <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={t(lang, 'ask')} required />
        <button disabled={busy}>{busy ? '...' : t(lang, 'send')}</button>
      </form>
    </section>
  );
}

function welcomeMessage(lang: Lang): CoachMessage {
  if (lang === 'en') return { role: 'assistant', text: 'Ask me about your games, openings, mistakes, or training plan.' };
  if (lang === 'kk') return { role: 'assistant', text: 'Партияларың, дебюттерің, қателерің немесе жаттығу жоспарың туралы сұра.' };
  return { role: 'assistant', text: 'Спроси меня о партиях, дебютах, ошибках или плане тренировок.' };
}
