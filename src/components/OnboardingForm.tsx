import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { interfaceModeForBirthDate, readOnboardingData, type Gender } from '../lib/userOnboarding';
import type { Lang } from '../lib/types';

type Props = {
  lang: Lang;
  metadata: unknown;
  onComplete: () => Promise<void>;
  onLangChange?: (lang: Lang) => void;
};

type Labels = {
  title: string;
  intro: string;
  nickname: string;
  birthDate: string;
  gender: string;
  language: string;
  save: string;
  error: string;
};

const text: Record<Lang, Labels> = {
  ru: {
    title: 'Расскажи немного о себе',
    intro: 'После регистрации укажи ник, дату рождения и язык интерфейса.',
    nickname: 'Ник',
    birthDate: 'Дата рождения',
    gender: 'Пол тренера',
    language: 'Язык',
    save: 'Сохранить',
    error: 'Не получилось сохранить данные. Попробуй еще раз.',
  },
  en: {
    title: 'Tell us a little about you',
    intro: 'After registration, add your nickname, birth date, and interface language.',
    nickname: 'Nickname',
    birthDate: 'Birth date',
    gender: 'Coach gender',
    language: 'Language',
    save: 'Save',
    error: 'Could not save the data. Try again.',
  },
  kk: {
    title: 'Өзің туралы қысқаша',
    intro: 'Тіркелгеннен кейін ник, туған күніңді және интерфейс тілін таңда.',
    nickname: 'Ник',
    birthDate: 'Туған күн',
    gender: 'Жаттықтырушы жынысы',
    language: 'Тіл',
    save: 'Сақтау',
    error: 'Деректер сақталмады. Қайта көр.',
  },
};

export function OnboardingForm({ lang, metadata, onComplete, onLangChange }: Props) {
  const labels = text[lang];
  const initial = readOnboardingData(metadata);
  const [displayName, setDisplayName] = useState(initial.displayName ?? '');
  const [birthDate, setBirthDate] = useState(initial.birthDate ?? '');
  const [gender, setGender] = useState<Gender>(initial.gender ?? 'male');
  const [preferredLang, setPreferredLang] = useState<Lang>(initial.preferredLang ?? lang);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage('');

    const cleanName = displayName.trim();
    const interfaceMode = interfaceModeForBirthDate(birthDate);
    const { error } = await supabase.auth.updateUser({
      data: {
        username: cleanName,
        display_name: cleanName,
        full_name: cleanName,
        birth_date: birthDate,
        gender,
        preferred_lang: preferredLang,
        is_adult: interfaceMode === 'main',
        interface_mode: interfaceMode,
      },
    });

    if (error) {
      setMessage(labels.error);
      setBusy(false);
      return;
    }

    onLangChange?.(preferredLang);
    await onComplete();
    setBusy(false);
  }

  return (
    <section className="auth-card onboarding-card">
      <h1>{labels.title}</h1>
      <p>{labels.intro}</p>
      <form className="coach-form onboarding-form" onSubmit={submit}>
        <label>
          <span>{labels.nickname}</span>
          <input
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            minLength={2}
            maxLength={24}
            required
          />
        </label>
        <label>
          <span>{labels.birthDate}</span>
          <input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} required />
        </label>
        <label>
          <span>{labels.gender}</span>
          <select value={gender} onChange={(event) => setGender(event.target.value as Gender)}>
            <option value="male">Мальчик / парень</option>
            <option value="female">Девочка / девушка</option>
          </select>
        </label>
        <label>
          <span>{labels.language}</span>
          <select value={preferredLang} onChange={(event) => setPreferredLang(event.target.value as Lang)}>
            <option value="ru">Русский</option>
            <option value="en">English</option>
            <option value="kk">Қазақша</option>
          </select>
        </label>
        <button type="submit" disabled={busy}>{busy ? '...' : labels.save}</button>
      </form>
      {message && <p className="message">{message}</p>}
    </section>
  );
}
