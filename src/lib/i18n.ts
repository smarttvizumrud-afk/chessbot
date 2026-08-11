import { dictionaries } from './i18nDictionaries';
import type { Lang, MoveReport } from './types';

const insightKeys = [
  'tactical vision',
  'opening plans',
  'endgame technique',
  'calculation discipline',
  'forcing moves',
  'tactical contact',
  'clean play',
] as const;

type InsightKey = typeof insightKeys[number];

export function t(lang: Lang, key: string) {
  return dictionaries[lang][key] ?? key;
}

export function labelText(lang: Lang, label: MoveReport['label']) {
  const values: Record<Lang, Record<MoveReport['label'], string>> = {
    ru: { good: 'хорошо', inaccuracy: 'неточность', mistake: 'ошибка', blunder: 'зевок' },
    en: { good: 'good', inaccuracy: 'inaccuracy', mistake: 'mistake', blunder: 'blunder' },
    kk: { good: 'жақсы', inaccuracy: 'дәлсіздік', mistake: 'қате', blunder: 'өрескел қате' },
  };
  return values[lang][label];
}

export function localizeInsight(value: string, lang: Lang): string {
  if (lang === 'en') return value;
  const text = value.replace(/\.$/, '');
  const map = insightMap(lang);
  if (isInsightKey(text)) return map[text];
  const plan = localizeTrainingPlan(text, lang);
  if (plan) return plan;
  return insightKeys.reduce((result, key) => result.replace(key, map[key]), text);
}

export function openingRecommendationText(
  lang: Lang,
  opening: string,
  accuracy: number,
  errors: number,
) {
  if (lang === 'en') return englishOpeningRecommendation(opening, accuracy, errors);
  if (lang === 'kk') return kazakhOpeningRecommendation(opening, accuracy, errors);
  return russianOpeningRecommendation(opening, accuracy, errors);
}

function englishOpeningRecommendation(opening: string, accuracy: number, errors: number) {
  if (errors >= 3) return `Review the first critical moment in ${opening}.`;
  if (accuracy && accuracy < 75) return `Learn two model games in ${opening}.`;
  return `Keep ${opening} as a stable part of the repertoire.`;
}

function russianOpeningRecommendation(opening: string, accuracy: number, errors: number) {
  if (errors >= 3) return `Пересмотри первый критический момент в дебюте ${opening}.`;
  if (accuracy && accuracy < 75) return `Изучи две модельные партии в дебюте ${opening}.`;
  return `Оставь ${opening} как стабильную часть репертуара.`;
}

function kazakhOpeningRecommendation(opening: string, accuracy: number, errors: number) {
  if (errors >= 3) return `${opening} дебютіндегі алғашқы маңызды сәтті қайта қара.`;
  if (accuracy && accuracy < 75) return `${opening} бойынша екі үлгі партияны үйрен.`;
  return `${opening} дебютін репертуардағы тұрақты қару ретінде сақта.`;
}

function insightMap(lang: Lang): Record<InsightKey, string> {
  if (lang === 'kk') {
    return {
      'tactical vision': 'тактикалық көру',
      'opening plans': 'дебют жоспарлары',
      'endgame technique': 'эндшпиль техникасы',
      'calculation discipline': 'есептеу тәртібі',
      'forcing moves': 'мәжбүрлейтін жүрістер',
      'tactical contact': 'тактикалық байланыс',
      'clean play': 'таза ойын',
    };
  }
  return {
    'tactical vision': 'тактическое зрение',
    'opening plans': 'планы в дебюте',
    'endgame technique': 'техника эндшпиля',
    'calculation discipline': 'дисциплина расчёта',
    'forcing moves': 'форсированные ходы',
    'tactical contact': 'тактический контакт',
    'clean play': 'аккуратная игра',
  };
}

function localizeTrainingPlan(text: string, lang: Lang): string {
  const openingMatch = text.match(/^Study typical plans in (.+)$/);
  if (openingMatch) {
    return lang === 'kk'
      ? `${openingMatch[1]} дебютіндегі негізгі жоспарларды үйрен`
      : `Изучи типовые планы в дебюте ${openingMatch[1]}`;
  }
  if (text === 'Train practical rook and pawn endgames') {
    return lang === 'kk' ? 'Практикалық ладья және пешка эндшпильдерін жаттықтыр' : 'Тренируй практические ладейные и пешечные окончания';
  }
  const focus = text.match(/^Start with focused exercises on (.+)$/);
  if (focus) return lang === 'kk' ? `Алдымен ${localizeInsight(focus[1], lang)} жаттығуларынан баста` : `Начни с упражнений на тему: ${localizeInsight(focus[1], lang)}`;
  const extra = text.match(/^Add 15 minutes of (.+) training after each analysed game$/);
  if (extra) return lang === 'kk' ? `Әр талданған партиядан кейін ${localizeInsight(extra[1], lang)} бойынша 15 минут жаттық` : `После каждой партии тренируй ${localizeInsight(extra[1], lang)} 15 минут`;
  return '';
}

function isInsightKey(value: string): value is InsightKey {
  return insightKeys.includes(value as InsightKey);
}
