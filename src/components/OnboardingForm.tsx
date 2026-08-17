import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { readOnboardingData } from '../lib/userOnboarding';
import type { Lang } from '../lib/types';

type Props = {
  lang: Lang;
  metadata: unknown;
  onComplete: () => Promise<void>;
  onLangChange?: (lang: Lang) => void;
};

const text: Record<Lang, {
  title: string;
  intro: string;
  birthDate: string;
  language: string;
  save: string;
  error: string;
}> = {
  ru: {
    title: 'Расскажи немного о себе',
    intro: 'После регистрации укажи дату рождения и язык интерфейса.',
    birthDate: 'Дата рождения',
    language: 'Язык',
    save: 'Сохранить',
    error: 'Не получилось сохранить данные. Попробуй ещё раз.',
  },
  en: {
    title: 'Tell us a little about you',
    intro: 'After registration, add your birth date and interface language.',
    birthDate: 'Birth date',
    language: 'Language',
    save: 'Save',
    error: 'Could not save the data. Try again.',
  },
  kk: {
    title: 'Өзің туралы қысқаша',
    intro: 'Тіркелгеннен кейін туған күніңді және интерфейс тілін таңда.',
    birthDate: 'Туған күн',
    language: 'Тіл',
    save: 'Сақтау',
    error: 'Деректер сақталмады. Қайта көр.',
  },
};

export function OnboardingForm({ lang, metadata, onComplete, onLangChange }: Props) {
  const labels = text[lang];
  const initial = readOnboardingData(metadata);
  const [birthDate, setBirthDate] = useState(initial.birthDate ?? '');
  const [preferredLang, setPreferredLang] = useState<Lang>(initial.preferredLang ?? lang);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const { error } = await supabase.auth.updateUser({
      data: {
        birth_date: birthDate,
        preferred_lang: preferredLang,
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
          <span>{labels.birthDate}</span>
          <input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} required />
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
