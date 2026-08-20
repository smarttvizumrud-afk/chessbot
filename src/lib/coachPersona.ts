import type { Lang } from './types';
import type { Gender, InterfaceMode } from './userOnboarding';

export type CoachPersona = {
  gender: Gender;
  age: number;
  icon: string;
  name: string;
  role: string;
  tone: string;
};

const maleNames: Record<Lang, string[]> = {
  ru: ['Тимур', 'Арман', 'Данил'],
  en: ['Timur', 'Arman', 'Daniel'],
  kk: ['Timur', 'Arman', 'Danil'],
};

const femaleNames: Record<Lang, string[]> = {
  ru: ['Амина', 'Айша', 'София'],
  en: ['Amina', 'Aisha', 'Sofia'],
  kk: ['Amina', 'Aisha', 'Sofiya'],
};

export function coachPersona(
  interfaceMode: InterfaceMode,
  gender: Gender,
  lang: Lang,
  userAge?: number,
): CoachPersona {
  const stage = personaStage(interfaceMode, userAge);
  const names = gender === 'female' ? femaleNames[lang] : maleNames[lang];
  const icons = gender === 'female' ? ['👧', '🧒', '👩'] : ['👦', '🧑', '👨'];
  return {
    gender,
    age: stage.age,
    icon: icons[stage.index],
    name: names[stage.index],
    role: roleText(lang, stage.age),
    tone: toneText(lang, stage.age, gender),
  };
}

function personaStage(interfaceMode: InterfaceMode, userAge?: number) {
  if (interfaceMode === 'child') return { index: 0, age: 4 };
  if (interfaceMode === 'preschool') return { index: 1, age: 10 };
  if (typeof userAge === 'number' && userAge < 12) return { index: 1, age: 10 };
  return { index: 2, age: 18 };
}

function roleText(lang: Lang, age: number) {
  if (lang === 'en') return age < 12 ? 'kind chess helper' : 'analysis partner';
  if (lang === 'kk') return age < 12 ? 'мейірімді көмекші' : 'талдау серігі';
  return age < 12 ? 'добрый помощник' : 'партнёр по разбору';
}

function toneText(lang: Lang, age: number, gender: Gender) {
  if (lang === 'en') return age < 12
    ? 'Explains in tiny friendly steps.'
    : 'Explains calmly, simply, and like a real person.';
  if (lang === 'kk') return age < 12
    ? 'Қысқа әрі жылы түсіндіреді.'
    : 'Тыныш, қарапайым және адамша түсіндіреді.';
  const verb = gender === 'female' ? 'объясняет' : 'объясняет';
  return age < 12
    ? `Коротко и тепло ${verb}, что делать дальше.`
    : `Спокойно и по-человечески ${verb}, где был главный момент.`;
}

export function personaAdvice(persona: CoachPersona, lang: Lang, text: string) {
  if (lang === 'en') return `${persona.name}: ${text}`;
  if (lang === 'kk') return `${persona.name}: ${text}`;
  return `${persona.name}: ${text}`;
}
