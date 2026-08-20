import { useEffect, useRef, useState } from 'react';
import { AuthGate } from '../components/AuthGate';
import { askCoach, type CoachMessage } from '../lib/aiCoach';
import { NotEnoughCreditsError } from '../lib/credits';
import { t } from '../lib/i18n';
import { supabase } from '../lib/supabase';
import { speakWithChildVoice } from '../lib/tts';
import type { Lang } from '../lib/types';
import { useChessData } from '../lib/useChessData';
import { ageFromBirthDate, readOnboardingData, type InterfaceMode } from '../lib/userOnboarding';

type CoachChat = {
  id: string;
  title: string;
  messages: CoachMessage[];
};

const chatsStorageKey = 'chesa-coach-chats';
let childVoiceUnavailableUntil = 0;

export function CoachPage({ lang }: { lang: Lang }) {
  return (
    <AuthGate lang={lang}>
      <CoachContent lang={lang} />
    </AuthGate>
  );
}

function CoachContent({ lang }: { lang: Lang }) {
  const { games, analyses } = useChessData();
  const [chats, setChats] = useState<CoachChat[]>(() => loadChats(lang));
  const [activeChatId, setActiveChatId] = useState('');
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [speechBusy, setSpeechBusy] = useState(false);
  const [speechNotice, setSpeechNotice] = useState('');
  const [interfaceMode, setInterfaceMode] = useState<InterfaceMode>('main');
  const [userAge, setUserAge] = useState<number>();
  const speechBusyRef = useRef(false);
  const activeChat = chats.find((chat) => chat.id === activeChatId) ?? chats[0] ?? createChat(lang);
  const messages = activeChat.messages;

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

  useEffect(() => {
    saveChats(chats);
  }, [chats]);

  useEffect(() => {
    if (!chats.some((chat) => chat.id === activeChatId)) setActiveChatId(chats[0]?.id ?? '');
  }, [activeChatId, chats]);

  function startChat() {
    const chat = createChat(lang);
    setChats((items) => [chat, ...items]);
    setActiveChatId(chat.id);
    setQuestion('');
  }

  function updateActiveChat(messages: CoachMessage[]) {
    setChats((items) => items.map((chat) => (
      chat.id === activeChat.id
        ? { ...chat, title: chatTitle(messages, lang), messages }
        : chat
    )));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const text = question.trim();
    if (!text || busy) return;

    const nextMessages: CoachMessage[] = [...messages, { role: 'user', text }];
    updateActiveChat(nextMessages);
    setQuestion('');
    setBusy(true);
    const answer = await askCoachAnswer(text, lang, games, analyses, nextMessages, interfaceMode, userAge);
    const assistantMessages = messages.filter((message) => message.role === 'assistant');
    const lastAnswer = assistantMessages[assistantMessages.length - 1]?.text;
    updateActiveChat(lastAnswer === answer ? nextMessages : [...nextMessages, { role: 'assistant', text: answer }]);
    setBusy(false);
  }

  async function playAnswer(text: string) {
    if (speechBusyRef.current) return;
    speechBusyRef.current = true;
    setSpeechNotice('');
    setSpeechBusy(true);
    try {
      const result = await speak(text, lang, userAge, interfaceMode);
      if (result === 'elevenlabs-unavailable') setSpeechNotice(childVoiceErrorText(lang));
    } finally {
      speechBusyRef.current = false;
      setSpeechBusy(false);
    }
  }

  return (
    <section className="panel coach-panel">
      <div className="coach-header">
        <h1>{t(lang, 'coach')}</h1>
        <button type="button" onClick={startChat}>{chatCopy(lang).newChat}</button>
      </div>
      <div className="coach-chat-layout">
        <aside className="chat-list" aria-label={chatCopy(lang).chats}>
          <strong>{chatCopy(lang).chats}</strong>
          {chats.map((chat) => (
            <button
              className={chat.id === activeChat.id ? 'active' : ''}
              type="button"
              onClick={() => setActiveChatId(chat.id)}
              key={chat.id}
            >
              {chat.title}
            </button>
          ))}
        </aside>
        <div className="coach-chat-main">
          <div className="chat-window">
            {messages.map((message, index) => (
              <article className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>
                <span>
                  {message.role === 'user' ? t(lang, 'you') : t(lang, 'coach')}
                  {message.role === 'assistant' && canSpeak(interfaceMode) && (
                    <button className="speak-button" type="button" onClick={() => void playAnswer(message.text)} disabled={speechBusy} aria-label="Speak answer">
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
          {speechNotice && <p className="message">{speechNotice}</p>}
        </div>
      </div>
    </section>
  );
}

function loadChats(lang: Lang): CoachChat[] {
  if (typeof window === 'undefined') return [createChat(lang)];
  try {
    const stored = JSON.parse(window.localStorage.getItem(chatsStorageKey) ?? '[]') as unknown;
    if (!Array.isArray(stored)) return [createChat(lang)];
    const chats = stored.filter(isCoachChat).slice(0, 12);
    return chats.length ? chats : [createChat(lang)];
  } catch {
    return [createChat(lang)];
  }
}

function saveChats(chats: CoachChat[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(chatsStorageKey, JSON.stringify(chats.slice(0, 12)));
}

function createChat(lang: Lang): CoachChat {
  return {
    id: crypto.randomUUID(),
    title: chatCopy(lang).newChat,
    messages: [welcomeMessage(lang)],
  };
}

function chatTitle(messages: CoachMessage[], lang: Lang) {
  const userMessage = messages.find((message) => message.role === 'user')?.text.trim();
  if (!userMessage) return chatCopy(lang).newChat;
  return userMessage.length > 34 ? `${userMessage.slice(0, 34)}...` : userMessage;
}

function chatCopy(lang: Lang) {
  if (lang === 'en') return { chats: 'Chats', newChat: 'New chat' };
  if (lang === 'kk') return { chats: 'Chattar', newChat: 'Jana chat' };
  return { chats: 'Чаты', newChat: 'Новый чат' };
}

function isCoachChat(value: unknown): value is CoachChat {
  if (!value || typeof value !== 'object') return false;
  const chat = value as Record<string, unknown>;
  return typeof chat.id === 'string'
    && typeof chat.title === 'string'
    && Array.isArray(chat.messages)
    && chat.messages.every(isCoachMessage);
}

function isCoachMessage(value: unknown): value is CoachMessage {
  if (!value || typeof value !== 'object') return false;
  const message = value as Record<string, unknown>;
  return (message.role === 'user' || message.role === 'assistant') && typeof message.text === 'string';
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

function childVoiceErrorText(lang: Lang) {
  if (lang === 'en') return 'ElevenLabs voice is unavailable now. Try again later.';
  if (lang === 'kk') return 'ElevenLabs dausy qazir qosyldap turgan joq. Keinirek qaitalap kor.';
  return 'Голос ElevenLabs сейчас недоступен. Попробуй ещё раз позже.';
}

function canSpeak(interfaceMode?: InterfaceMode) {
  if (interfaceMode === 'child') {
    return typeof window !== 'undefined'
      && ('Audio' in window || ('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window));
  }
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

async function speak(text: string, lang: Lang, userAge: number | undefined, interfaceMode: InterfaceMode) {
  if (!canSpeak(interfaceMode)) return 'unavailable';
  const cleanText = cleanSpeechText(text);
  const isChildMode = interfaceMode === 'child';
  if (isChildMode) {
    if (Date.now() >= childVoiceUnavailableUntil) {
      try {
        await speakWithChildVoice(cleanText);
        return 'elevenlabs';
      } catch (error) {
        childVoiceUnavailableUntil = Date.now() + 5 * 60 * 1_000;
        console.warn('Could not use child ElevenLabs voice.', error);
      }
    }
    return 'elevenlabs-unavailable';
  }

  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return 'unavailable';
  window.speechSynthesis.cancel();
  const voice = await bestVoice(lang);
  const voiceStyle = speechStyle(userAge);
  const chunks = speechChunks(cleanText);
  if (!chunks.length) return 'unavailable';
  await new Promise<void>((resolve) => {
    let completed = 0;
    const finishChunk = () => {
      completed += 1;
      if (completed >= chunks.length) resolve();
    };
    chunks.forEach((chunk) => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = speechLang(lang);
      utterance.volume = 1;
      utterance.rate = voiceStyle.rate;
      utterance.pitch = voiceStyle.pitch;
      if (voice) utterance.voice = voice;
      utterance.onend = finishChunk;
      utterance.onerror = finishChunk;
      window.speechSynthesis.speak(utterance);
    });
  });
  return 'browser';
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
