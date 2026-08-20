import { useEffect, useRef, useState } from 'react';
import { AuthGate } from '../components/AuthGate';
import { askCoach, type CoachMessage } from '../lib/aiCoach';
import { NotEnoughCreditsError } from '../lib/credits';
import { t } from '../lib/i18n';
import { coachPersona, personaIntro } from '../lib/coachPersona';
import { canSpeak, speakCoachText, speechErrorText } from '../lib/coachSpeech';
import { supabase } from '../lib/supabase';
import type { Lang } from '../lib/types';
import { useChessData } from '../lib/useChessData';
import { ageFromBirthDate, readOnboardingData, type Gender, type InterfaceMode } from '../lib/userOnboarding';

type CoachChat = {
  id: string;
  lang: Lang;
  title: string;
  messages: CoachMessage[];
};

const chatsStorageKey = 'chesa-coach-chats';

export function CoachPage({ lang }: { lang: Lang }) {
  return (
    <AuthGate lang={lang}>
      <CoachContent lang={lang} />
    </AuthGate>
  );
}

function CoachContent({ lang }: { lang: Lang }) {
  const { games, analyses } = useChessData();
  const [interfaceMode, setInterfaceMode] = useState<InterfaceMode>('main');
  const [userAge, setUserAge] = useState<number>();
  const [gender, setGender] = useState<Gender>('male');
  const [chats, setChats] = useState<CoachChat[]>(() => loadChats(lang, 'main', 'male'));
  const [activeChatId, setActiveChatId] = useState('');
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [speechBusy, setSpeechBusy] = useState(false);
  const [speechNotice, setSpeechNotice] = useState('');
  const speechBusyRef = useRef(false);
  const activeChat = chats.find((chat) => chat.id === activeChatId) ?? chats[0] ?? createChat(lang, interfaceMode, gender, userAge);
  const messages = activeChat.messages;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const rawMetadata = data.user?.user_metadata;
      const metadata = readOnboardingData(rawMetadata);
      if (metadata.interfaceMode) setInterfaceMode(metadata.interfaceMode);
      if (metadata.gender) setGender(metadata.gender);
      const age = metadata.birthDate ? ageFromBirthDate(metadata.birthDate) : null;
      setUserAge(age ?? undefined);
    });
  }, []);

  useEffect(() => {
    saveChats(chats);
  }, [chats]);

  useEffect(() => {
    if (!chats.some((chat) => chat.id === activeChatId)) setActiveChatId(chats[0]?.id ?? '');
  }, [activeChatId, chats]);

  function startChat() {
    const chat = createChat(lang, interfaceMode, gender, userAge);
    setChats((items) => [chat, ...items]);
    setActiveChatId(chat.id);
    setQuestion('');
  }

  function updateActiveChat(messages: CoachMessage[]) {
    setChats((items) => items.map((chat) => (
      chat.id === activeChat.id
        ? { ...chat, lang, title: chatTitle(messages, lang), messages }
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
    const answer = await askCoachAnswer(text, lang, games, analyses, nextMessages, interfaceMode, userAge, gender);
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
      const result = await speakCoachText(text, interfaceMode, gender, lang);
      if (result === 'elevenlabs-unavailable') setSpeechNotice(childVoiceErrorText(lang));
    } catch (error) {
      console.warn('Could not speak coach answer.', error);
      setSpeechNotice(speechErrorText(lang, error));
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
      <CoachPersonaBadge lang={lang} interfaceMode={interfaceMode} gender={gender} userAge={userAge} />
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
                  {message.role === 'assistant' && canSpeak() && (
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

function loadChats(lang: Lang, interfaceMode: InterfaceMode, gender: Gender, userAge?: number): CoachChat[] {
  if (typeof window === 'undefined') return [createChat(lang, interfaceMode, gender, userAge)];
  try {
    const stored = JSON.parse(window.localStorage.getItem(chatsStorageKey) ?? '[]') as unknown;
    if (!Array.isArray(stored)) return [createChat(lang, interfaceMode, gender, userAge)];
    const chats = stored.filter(isCoachChat).filter((chat) => chat.lang === lang).slice(0, 12);
    return chats.length ? chats : [createChat(lang, interfaceMode, gender, userAge)];
  } catch {
    return [createChat(lang, interfaceMode, gender, userAge)];
  }
}

function saveChats(chats: CoachChat[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(chatsStorageKey, JSON.stringify(chats.slice(0, 12)));
}

function createChat(lang: Lang, interfaceMode: InterfaceMode, gender: Gender, userAge?: number): CoachChat {
  return {
    id: crypto.randomUUID(),
    lang,
    title: chatCopy(lang).newChat,
    messages: [welcomeMessage(lang, interfaceMode, gender, userAge)],
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
    && isLang(chat.lang)
    && typeof chat.title === 'string'
    && Array.isArray(chat.messages)
    && chat.messages.every(isCoachMessage);
}

function isCoachMessage(value: unknown): value is CoachMessage {
  if (!value || typeof value !== 'object') return false;
  const message = value as Record<string, unknown>;
  return (message.role === 'user' || message.role === 'assistant') && typeof message.text === 'string';
}

function isLang(value: unknown): value is Lang {
  return value === 'ru' || value === 'en' || value === 'kk';
}

async function askCoachAnswer(
  text: string,
  lang: Lang,
  games: ReturnType<typeof useChessData>['games'],
  analyses: ReturnType<typeof useChessData>['analyses'],
  messages: CoachMessage[],
  interfaceMode: InterfaceMode,
  userAge?: number,
  gender: Gender = 'male',
) {
  try {
    return await askCoach(text, lang, games, analyses, messages, interfaceMode, userAge, gender);
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

function CoachPersonaBadge({
  lang,
  interfaceMode,
  gender,
  userAge,
}: {
  lang: Lang;
  interfaceMode: InterfaceMode;
  gender: Gender;
  userAge?: number;
}) {
  const persona = coachPersona(interfaceMode, gender, lang, userAge);
  return (
    <div className="coach-persona">
      <span className={`coach-avatar ${gender}`}>{persona.icon}</span>
      <div>
        <strong>{persona.name}</strong>
        <p>{persona.role}. {persona.tone}</p>
      </div>
    </div>
  );
}


function welcomeMessage(lang: Lang, interfaceMode: InterfaceMode, gender: Gender, userAge?: number): CoachMessage {
  const persona = coachPersona(interfaceMode, gender, lang, userAge);
  if (lang === 'en') {
    return { role: 'assistant', text: personaIntro(persona, lang, 'Ask me about your games, openings, mistakes, or training plan.') };
  }
  if (lang === 'kk') {
    return { role: 'assistant', text: personaIntro(persona, lang, 'Партияларың, дебюттерің, қателерің немесе жаттығу жоспарың туралы сұра.') };
  }
  return { role: 'assistant', text: personaIntro(persona, lang, 'Спроси меня о партиях, дебютах, ошибках или плане тренировок.') };
}
