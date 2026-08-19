import { useEffect, useState } from 'react';
import { AuthGate } from '../components/AuthGate';
import { askCoach, type CoachMessage } from '../lib/aiCoach';
import { NotEnoughCreditsError } from '../lib/credits';
import { t } from '../lib/i18n';
import { supabase } from '../lib/supabase';
import type { Lang } from '../lib/types';
import { useChessData } from '../lib/useChessData';
import { ageFromBirthDate, readOnboardingData, type InterfaceMode } from '../lib/userOnboarding';

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
  const [userAge, setUserAge] = useState<number>();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const metadata = readOnboardingData(data.user?.user_metadata);
      if (metadata.interfaceMode) setInterfaceMode(metadata.interfaceMode);
      if (metadata.birthDate) setUserAge(ageFromBirthDate(metadata.birthDate) ?? undefined);
    });
  }, []);

  useEffect(() => {
    if (!canSpeak()) return;
    window.speechSynthesis.getVoices();
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const text = question.trim();
    if (!text || busy) return;

    const nextMessages: CoachMessage[] = [...messages, { role: 'user', text }];
    setMessages(nextMessages);
    setQuestion('');
    setBusy(true);
    const answer = await askCoachAnswer(text, lang, games, analyses, nextMessages, interfaceMode, userAge);
    const assistantMessages = messages.filter((message) => message.role === 'assistant');
    const lastAnswer = assistantMessages[assistantMessages.length - 1]?.text;
    setMessages(lastAnswer === answer ? nextMessages : [...nextMessages, { role: 'assistant', text: answer }]);
    void speak(answer, lang, userAge);
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
                <button className="speak-button" type="button" onClick={() => void speak(message.text, lang, userAge)} aria-label="Speak answer">
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

async function askCoachAnswer(
  text: string,
  lang: Lang,
  games: ReturnType<typeof useChessData>['games'],
  analyses: ReturnType<typeof useChessData>['analyses'],
  messages: CoachMessage[],
  interfaceMode: InterfaceMode,
  userAge?: number,
) {
  try {
    return await askCoach(text, lang, games, analyses, messages, interfaceMode, userAge);
  } catch (error) {
    if (error instanceof NotEnoughCreditsError) return noCreditsText(lang);
    throw error;
  }
}

function noCreditsText(lang: Lang) {
  if (lang === 'en') return 'Credits are empty. One AI coach request costs 1 credit. Open Credits to buy more.';
  if (lang === 'kk') return 'Kreditter bittti. AI trenerge bir suraq 1 kredit turady. Kreditter bolimine otip, tagy satyp al.';
  return 'Кредиты закончились. Один запрос к AI-тренеру стоит 1 кредит. Открой раздел «Кредиты», чтобы купить ещё.';
}

function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

async function speak(text: string, lang: Lang, userAge?: number) {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
  const voice = await bestVoice(lang);
  const voiceStyle = speechStyle(userAge);
  speechChunks(text).forEach((chunk) => {
    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.lang = speechLang(lang);
    utterance.volume = 1;
    utterance.rate = voiceStyle.rate;
    utterance.pitch = voiceStyle.pitch;
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  });
}

function speechStyle(userAge?: number) {
  if (typeof userAge !== 'number') return { rate: 0.96, pitch: 1 };
  if (userAge < 12) return { rate: 0.9, pitch: 1.08 };
  if (userAge <= 15) return { rate: 0.98, pitch: 1.02 };
  if (userAge <= 18) return { rate: 1.02, pitch: 0.98 };
  return { rate: 0.96, pitch: 0.96 };
}

async function bestVoice(lang: Lang) {
  const voices = await loadVoices();
  const prefix = speechLang(lang).slice(0, 2).toLowerCase();
  const matching = voices.filter((voice) => voice.lang.toLowerCase().startsWith(prefix));
  return matching.sort((left, right) => voiceScore(right) - voiceScore(left))[0]
    ?? voices.find((voice) => voice.default)
    ?? matching[0]
    ?? null;
}

function loadVoices() {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length) return Promise.resolve(voices);

  return new Promise<SpeechSynthesisVoice[]>((resolve) => {
    const timer = window.setTimeout(() => resolve(window.speechSynthesis.getVoices()), 800);
    window.speechSynthesis.onvoiceschanged = () => {
      window.clearTimeout(timer);
      resolve(window.speechSynthesis.getVoices());
    };
  });
}

function voiceScore(voice: SpeechSynthesisVoice) {
  const name = voice.name.toLowerCase();
  let score = voice.default ? 4 : 0;
  if (name.includes('natural')) score += 8;
  if (name.includes('neural')) score += 8;
  if (name.includes('online')) score += 5;
  if (name.includes('google')) score += 5;
  if (name.includes('microsoft')) score += 5;
  if (name.includes('apple')) score += 4;
  if (name.includes('yandex')) score += 4;
  if (name.includes('premium')) score += 3;
  return score;
}

function speechChunks(text: string) {
  return cleanSpeechText(text)
    .split(/(?<=[.!?])\s+/)
    .flatMap((sentence) => splitLongSpeech(sentence, 180))
    .filter(Boolean);
}

function splitLongSpeech(text: string, maxLength: number) {
  if (text.length <= maxLength) return [text];
  const chunks: string[] = [];
  let current = '';
  text.split(/,\s+|\s+-\s+/).forEach((part) => {
    const next = current ? `${current}, ${part}` : part;
    if (next.length > maxLength && current) {
      chunks.push(current);
      current = part;
    } else {
      current = next;
    }
  });
  if (current) chunks.push(current);
  return chunks;
}

function cleanSpeechText(text: string) {
  return text
    .replace(/[`*_#>]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\bAI\b/g, 'эй ай')
    .replace(/[^\p{L}\p{N}\s.,!?;:()\-+/%]/gu, '')
    .trim();
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
