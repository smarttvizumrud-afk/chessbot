import type { Lang } from './types';

const openingRu: Record<string, string> = {
  'Alekhine Defense': 'Защита Алехина',
  'Benko Gambit': 'Гамбит Бенко',
  'Budapest Gambit': 'Будапештский гамбит',
  'Caro-Kann Defense': 'Защита Каро-Канн',
  'Catalan Opening': 'Каталонское начало',
  'Dutch Defense': 'Голландская защита',
  'English Opening': 'Английское начало',
  'French Defense': 'Французская защита',
  'Italian Game': 'Итальянская партия',
  "King's Pawn Game": 'Дебют королевской пешки',
  "King's Gambit": 'Королевский гамбит',
  "King's Indian Defense": 'Староиндийская защита',
  'London System': 'Лондонская система',
  'Maróczy Defense': 'защита Мароци',
  'Modern Bishop\'s Opening': 'современное развитие слона',
  'Nimzo-Indian Defense': 'Защита Нимцовича',
  'Petrov Defense': 'Русская партия',
  'Pirc Defense': 'Защита Пирца',
  "Queen's Pawn Game": 'Дебют ферзевой пешки',
  "Queen's Gambit": 'Ферзевый гамбит',
  'Reti Opening': 'Дебют Рети',
  'Ruy Lopez': 'Испанская партия',
  'Scandinavian Defense': 'Скандинавская защита',
  'Scotch Game': 'Шотландская партия',
  'Semi-Slav Defense': 'Полуславянская защита',
  'Sicilian Defense': 'Сицилианская защита',
  'Slav Defense': 'Славянская защита',
  'Smith-Morra Gambit': 'Гамбит Смита-Морра',
  'Trompowsky Attack': 'Атака Тромповского',
  'Vienna Game': 'Венская партия',
};

const variantRu: Record<string, string> = {
  'Accepted Structure': 'принятая структура',
  'Accepted Variation': 'принятый вариант',
  'Advance Variation': 'продвинутый вариант',
  'Austrian Attack': 'австрийская атака',
  'Berlin Defense': 'берлинская защита',
  'Blackburne Shilling Trap': 'ловушка Блэкберна-Шиллинга',
  'Botvinnik-Carls Defense': 'защита Ботвинника-Карлса',
  'Chigorin Variation': 'вариант Чигорина',
  'Classical Setup': 'классическая схема',
  'Classical Variation': 'классический вариант',
  'Declined Orthodox': 'отказанный ортодоксальный вариант',
  'Dragon Yugoslav Attack': 'дракон, югославская атака',
  'Evans Gambit': 'гамбит Эванса',
  'Fantasy Variation': 'вариант фантазия',
  'Four Knights': 'четыре коня',
  'Four Pawns Attack': 'атака четырёх пешек',
  'Fried Liver Attack': 'атака Фрид-Ливер',
  'King Fianchetto': 'фианкетто короля',
  'Legal Trap': 'ловушка Легаля',
  'Leningrad Setup': 'ленинградская система',
  'Main Line': 'главный вариант',
  'Main Setup': 'основная схема',
  'Main Trap Ideas': 'основные ловушки',
  'Meran Setup': 'меранская схема',
  'Najdorf Variation': 'вариант Найдорфа',
  'Colle System': 'система Колле',
  'Open Catalan Setup': 'открытая каталанская схема',
  'Orthodox': 'ортодоксальный вариант',
  'Stafford Gambit': 'гамбит Стаффорда',
  'Two Knights Defense': 'защита двух коней',
  'Winawer Variation': 'вариант Винавера',
};

const phraseRu: Record<string, string> = {
  ...openingRu,
  ...variantRu,
  'Attack': 'атака',
  'Defense': 'защита',
  'Fianchetto': 'фианкетто',
  'Gambit': 'гамбит',
  'Game': 'партия',
  'Opening': 'начало',
  "King's Pawn": 'королевская пешка',
  "Queen's Pawn": 'ферзевая пешка',
  'System': 'система',
  'Variation': 'вариант',
};

export function openingName(opening: string, lang: Lang) {
  if (lang !== 'ru') return opening;
  const exact = openingRu[opening];
  if (exact) return exact;

  return opening
    .split(':')
    .map((section) => section
      .split(',')
      .map((part) => translatePhrase(part.trim()))
      .join(', '))
    .join(': ');
}

export function variantName(variant: string, lang: Lang) {
  if (lang !== 'ru') return variant;
  return translatePhrase(variant);
}

function translatePhrase(value: string) {
  if (!value) return value;
  const exact = phraseRu[value];
  if (exact) return exact;

  return Object.entries(phraseRu)
    .sort((a, b) => b[0].length - a[0].length)
    .reduce((text, [english, russian]) => text.split(english).join(russian), value);
}
