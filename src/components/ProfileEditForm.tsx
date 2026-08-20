import { useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { interfaceModeForBirthDate, readOnboardingData, type Gender } from '../lib/userOnboarding';
import type { Lang } from '../lib/types';

type Props = {
  session: Session;
  lang: Lang;
  onCancel: () => void;
  onSaved: () => Promise<void>;
};

const labels: Record<Lang, {
  title: string;
  nickname: string;
  birthDate: string;
  gender: string;
  save: string;
  cancel: string;
  saved: string;
  error: string;
}> = {
  ru: {
    title: 'Редактировать профиль',
    nickname: 'Ник',
    birthDate: 'Дата рождения',
    gender: 'Пол тренера',
    save: 'Сохранить',
    cancel: 'Отмена',
    saved: 'Профиль обновлён.',
    error: 'Не удалось сохранить профиль.',
  },
  en: {
    title: 'Edit profile',
    nickname: 'Nickname',
    birthDate: 'Birth date',
    gender: 'Coach gender',
    save: 'Save',
    cancel: 'Cancel',
    saved: 'Profile updated.',
    error: 'Could not save profile.',
  },
  kk: {
    title: 'Профильді өңдеу',
    nickname: 'Ник',
    birthDate: 'Туған күн',
    gender: 'Жаттықтырушы жынысы',
    save: 'Сақтау',
    cancel: 'Бас тарту',
    saved: 'Профиль жаңартылды.',
    error: 'Профильді сақтау мүмкін болмады.',
  },
};

export function ProfileEditForm({ session, lang, onCancel, onSaved }: Props) {
  const text = labels[lang];
  const metadata = readOnboardingData(session.user.user_metadata);
  const [displayName, setDisplayName] = useState(metadata.displayName ?? '');
  const [birthDate, setBirthDate] = useState(metadata.birthDate ?? '');
  const [gender, setGender] = useState<Gender>(metadata.gender ?? 'male');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

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
        is_adult: interfaceMode === 'main',
        interface_mode: interfaceMode,
        preferred_lang: metadata.preferredLang ?? lang,
      },
    });

    if (error) {
      setMessage(text.error);
      setBusy(false);
      return;
    }

    await onSaved();
    setMessage(text.saved);
    setBusy(false);
  }

  return (
    <form className="profile-edit-form" onSubmit={submit}>
      <h2>{text.title}</h2>
      <label>
        <span>{text.nickname}</span>
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
        <span>{text.birthDate}</span>
        <input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} required />
      </label>
      <label>
        <span>{text.gender}</span>
        <select value={gender} onChange={(event) => setGender(event.target.value as Gender)}>
          <option value="male">Мальчик / парень</option>
          <option value="female">Девочка / девушка</option>
        </select>
      </label>
      <div className="profile-edit-actions">
        <button type="submit" disabled={busy}>{busy ? '...' : text.save}</button>
        <button type="button" className="ghost" onClick={onCancel} disabled={busy}>{text.cancel}</button>
      </div>
      {message && <p>{message}</p>}
    </form>
  );
}
