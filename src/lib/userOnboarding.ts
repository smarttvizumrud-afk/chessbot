import type { Lang } from './types';

export type OnboardingData = {
  displayName: string;
  birthDate: string;
  preferredLang: Lang;
  isAdult: boolean;
  interfaceMode: InterfaceMode;
};

export type InterfaceMode = 'main' | 'student' | 'preschool' | 'child';

export function readOnboardingData(metadata: unknown): Partial<OnboardingData> {
  if (!metadata || typeof metadata !== 'object') return {};
  const values = metadata as Record<string, unknown>;
  const displayName = getDisplayName(values);
  const birthDate = typeof values.birth_date === 'string' ? values.birth_date : '';
  const preferredLang = isLang(values.preferred_lang) ? values.preferred_lang : undefined;
  const interfaceMode = isValidBirthDate(birthDate)
    ? interfaceModeForBirthDate(birthDate)
    : isInterfaceMode(values.interface_mode)
      ? normalizeInterfaceMode(values.interface_mode)
      : 'main';
  const isAdult = interfaceMode === 'main'
    || (typeof values.is_adult === 'boolean' ? values.is_adult : getIsAdult(birthDate));

  return { displayName, birthDate, preferredLang, isAdult, interfaceMode };
}

export function isOnboardingComplete(metadata: unknown) {
  const data = readOnboardingData(metadata);
  return Boolean(data.displayName && data.birthDate && isValidBirthDate(data.birthDate) && data.preferredLang);
}

export function interfaceModeForBirthDate(birthDate: string): InterfaceMode {
  const age = ageFromBirthDate(birthDate);
  if (age === null) return 'main';
  if (age >= 3 && age < 6) return 'child';
  if (age >= 6 && age < 12) return 'preschool';
  return 'main';
}

export function ageFromBirthDate(birthDate: string) {
  return getAge(birthDate);
}

function getIsAdult(birthDate: string) {
  const age = ageFromBirthDate(birthDate);
  return age !== null && age > 18;
}

function getAge(birthDate: string, today = new Date()) {
  const parsed = parseBirthDate(birthDate);
  if (!parsed) return null;

  let age = today.getUTCFullYear() - parsed.getUTCFullYear();
  const monthDiff = today.getUTCMonth() - parsed.getUTCMonth();
  const hasBirthdayPassed = monthDiff > 0 || (monthDiff === 0 && today.getUTCDate() >= parsed.getUTCDate());
  if (!hasBirthdayPassed) age -= 1;

  return age;
}

function isValidBirthDate(birthDate: string) {
  return Boolean(parseBirthDate(birthDate));
}

function parseBirthDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isRealDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  if (!isRealDate || date.getTime() > Date.now()) return null;
  return date;
}

function isLang(value: unknown): value is Lang {
  return value === 'ru' || value === 'en' || value === 'kk';
}

function isInterfaceMode(value: unknown): value is InterfaceMode {
  return value === 'main' || value === 'student' || value === 'preschool' || value === 'child';
}

function normalizeInterfaceMode(value: InterfaceMode): InterfaceMode {
  return value === 'student' ? 'main' : value;
}

function getDisplayName(values: Record<string, unknown>) {
  return (
    getText(values.display_name) ||
    getText(values.username) ||
    getText(values.preferred_username) ||
    getText(values.name) ||
    getText(values.full_name)
  );
}

function getText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}
