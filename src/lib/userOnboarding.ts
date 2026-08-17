import type { Lang } from './types';

export type OnboardingData = {
  birthDate: string;
  preferredLang: Lang;
};

export function readOnboardingData(metadata: unknown): Partial<OnboardingData> {
  if (!metadata || typeof metadata !== 'object') return {};
  const values = metadata as Record<string, unknown>;
  const birthDate = typeof values.birth_date === 'string' ? values.birth_date : '';
  const preferredLang = isLang(values.preferred_lang) ? values.preferred_lang : undefined;
  return { birthDate, preferredLang };
}

export function isOnboardingComplete(metadata: unknown) {
  const data = readOnboardingData(metadata);
  return Boolean(data.birthDate && data.preferredLang);
}

function isLang(value: unknown): value is Lang {
  return value === 'ru' || value === 'en' || value === 'kk';
}
