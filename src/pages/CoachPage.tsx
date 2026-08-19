import { useEffect, useState } from 'react';
import { AuthGate } from '../components/AuthGate';
import { askCoach, type CoachMessage } from '../lib/aiCoach';
import { t } from '../lib/i18n';
import { supabase } from '../lib/supabase';
import type { Lang } from '../lib/types';
import { useChessData } from '../lib/useChessData';
import { readOnboardingData, type InterfaceMode } from '../lib/userOnboarding';

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
  const [interfaceMode, setInterfaceMode] = useState<InterfaceMode>('student');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const mode = readOnboardingData(data.user?.user_metadata).interfaceMode;
      if (mode) setInterfaceMode(mode);
    });
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const text = question.trim();
    if (!text || busy) return;

    const nextMessages: CoachMessage[] = [...messages, { role: 'user', text }];
    setMessages(nextMessages);
    setQuestion('');
    setBusy(true);
    const answer = await askCoach(text, lang, games, analyses, nextMessages, interfaceMode);
    const assistantMessages = messages.filter((message) => message.role === 'assistant');
    const lastAnswer = assistantMessages[assistantMessages.length - 1]?.text;
    setMessages(lastAnswer === answer ? nextMessages : [...nextMessages, { role: 'assistant', text: answer }]);
    if (interfaceMode === 'preschool') speak(answer, lang);
    setBusy(false);
  }

  return (
    <section className="panel coach-panel">
      <h1>{t(lang, 'coach')}</h1>
      <div className="chat-window">
        {messages.map((message, index) => (
          <article className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>
            <span>
              {message.role === 'user' ? t(lang, 'you') : t(lang, 'coach')}
              {message.role === 'assistant' && canSpeak() && (
                <button className="speak-button" type="button" onClick={() => speak(message.text, lang)} aria-label="Speak answer">
                  🔊
                </button>
              )}
            </span>
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

function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

function speak(text: string, lang: Lang) {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = speechLang(lang);
  utterance.rate = 0.9;
  utterance.pitch = 1.15;
  window.speechSynthesis.speak(utterance);
}

function speechLang(lang: Lang) {
  if (lang === 'en') return 'en-US';
  if (lang === 'kk') return 'kk-KZ';
  return 'ru-RU';
}

function welcomeMessage(lang: Lang): CoachMessage {
  if (lang === 'en') return { role: 'assistant', text: 'Ask me about your games, openings, mistakes, or training plan.' };
  if (lang === 'kk') return { role: 'assistant', text: 'Партияларың, дебюттерің, қателерің немесе жаттығу жоспарың туралы сұра.' };
  return { role: 'assistant', text: 'Спроси меня о партиях, дебютах, ошибках или плане тренировок.' };
}
