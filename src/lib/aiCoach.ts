import { supabase } from './supabase';
import type { Lang, StoredAnalysis, StoredGame } from './types';
import { combinedPlan, dashboardStats, openingStats } from './insights';
import { localizeInsight } from './i18n';
import type { InterfaceMode } from './userOnboarding';
import { spendCredits } from './credits';

export type CoachMessage = {
  role: 'user' | 'assistant';
  text: string;
};

const languageName: Record<Lang, string> = {
  ru: 'Russian',
  en: 'English',
  kk: 'Kazakh',
};

export async function askCoach(
  question: string,
  lang: Lang,
  games: StoredGame[],
  analyses: StoredAnalysis[],
  history: CoachMessage[] = [],
  interfaceMode: InterfaceMode = 'main',
  userAge?: number,
) {
  await spendCredits(1, 'ai_coach', { feature: 'coach_request', userAge });
  const context = buildContext(games, analyses);
  const system = [
    `You are a personal chess coach powered by Gemini. Answer in ${languageName[lang]}.`,
    'Use only the supplied player data, Stockfish results, openings, weaknesses, and chat history.',
    coachTone(interfaceMode, userAge),
  ].join(' ');
  const prompt = trimPrompt(`${context}\n\nChat history:\n${formatHistory(history)}\n\nUser question: ${question}`);
  const { data, error } = await supabase.functions.invoke('ai', { body: { prompt, system } });
  if (error) return fallbackAnswer(lang, games, analyses, interfaceMode);
  return readText(data) || fallbackAnswer(lang, games, analyses, interfaceMode);
}

export async function coachSummary(lang: Lang, games: StoredGame[], analyses: StoredAnalysis[]) {
  return askCoach('What should I improve first and why?', lang, games, analyses);
}

function coachTone(interfaceMode: InterfaceMode, userAge?: number) {
  if (interfaceMode === 'child') {
    return [
      ageSentence(userAge, 'The user is 3 to 5 years old.'),
      'Use tiny sentences, very simple words, warm playful tone, and one action at a time.',
      'Avoid complex notation, pressure, long explanations, and adult coaching language.',
    ].join(' ');
  }

  if (interfaceMode === 'preschool') {
    return [
      ageSentence(userAge, 'The user is 6 to 11 years old.'),
      'Explain chess like one friendly child talking to another child.',
      'Use very short sentences, simple words, playful encouragement, and one tiny step at a time.',
      'Do not use scary pressure, long analysis, notation-heavy explanations, or adult coaching language.',
    ].join(' ');
  }

  return 'Be concrete, kind, and concise.';
}

function ageSentence(userAge: number | undefined, fallback: string) {
  return typeof userAge === 'number' ? `The user is ${userAge} years old.` : fallback;
}

function buildContext(games: StoredGame[], analyses: StoredAnalysis[]) {
  const stats = dashboardStats(games, analyses);
  const openings = openingStats(games, analyses).slice(0, 5);
  const plan = combinedPlan(analyses).slice(0, 5);
  const recentGames = games.slice(0, 10).map((game) => ({
    platform: game.platform,
    username: game.username,
    opponent: game.opponent,
    result: game.result,
    color: game.color,
    rating: game.playerRating,
    opening: game.opening,
    playedAt: game.playedAt,
    timeControl: game.timeControl,
  }));
  const recentAnalyses = analyses.slice(0, 10).map((analysis) => ({
    accuracy: analysis.accuracy,
    mistakes: analysis.mistakes,
    blunders: analysis.blunders,
    weakSpots: analysis.weakSpots.slice(0, 3),
    trainingPlan: analysis.trainingPlan.slice(0, 3),
  }));

  return JSON.stringify({ stats, openings, plan, recentGames, recentAnalyses });
}

function formatHistory(history: CoachMessage[]) {
  return history
    .slice(-4)
    .map((message) => `${message.role}: ${message.text}`)
    .join('\n');
}

function trimPrompt(prompt: string) {
  return prompt.length > 9_500 ? prompt.slice(-9_500) : prompt;
}

function readText(data: unknown) {
  if (typeof data !== 'object' || !data || !('text' in data)) return '';
  const value = (data as { text?: unknown }).text;
  return typeof value === 'string' ? value.trim() : '';
}

function fallbackAnswer(lang: Lang, games: StoredGame[], analyses: StoredAnalysis[], interfaceMode: InterfaceMode) {
  if (interfaceMode === 'child' || interfaceMode === 'preschool') return preschoolFallback(lang, analyses.length > 0);
  if (!analyses.length) return noDataAnswer(lang);
  const stats = dashboardStats(games, analyses);
  const openings = openingStats(games, analyses);
  const mainWeakness = localizeInsight(stats.weaknesses[0] ?? 'calculation discipline', lang);
  const opening = openings[0]?.opening ?? '';

  if (lang === 'en') {
    return `I cannot reach Gemini right now, so here is a quick local coach note: your average accuracy is ${stats.accuracy}%. First focus: ${mainWeakness}. ${opening ? `In openings, review ${opening}.` : 'Analyse a few more games for opening advice.'}`;
  }
  if (lang === 'kk') {
    return `Gemini қазір жауап бермей тұр, сондықтан қысқа жергілікті кеңес: орташа дәлдігің ${stats.accuracy}%. Бірінші жұмыс бағыты: ${mainWeakness}. ${opening ? `Дебют бойынша ${opening} партияларын қайта қара.` : 'Дебютке кеңес алу үшін тағы бірнеше партия талда.'}`;
  }
  return `Gemini сейчас не отвечает, поэтому даю короткий локальный совет: средняя точность ${stats.accuracy}%. Первый фокус: ${mainWeakness}. ${opening ? `По дебютам пересмотри партии в ${opening}.` : 'Для дебютных советов проанализируй ещё несколько партий.'}`;
}

function preschoolFallback(lang: Lang, hasAnalyses: boolean) {
  if (lang === 'en') {
    return hasAnalyses
      ? 'Let us play one tiny chess step. Look for a piece that is in danger. Then help it, like a little teammate.'
      : 'First add a chess game. Then I can help with tiny, easy tips.';
  }
  if (lang === 'kk') {
    return hasAnalyses
      ? 'Бір кішкентай қадам жасайық. Қауіпте тұрған тасты тап. Сосын оған көмектес.'
      : 'Алдымен бір партия қос. Сосын мен өте оңай кеңес айтамын.';
  }
  return hasAnalyses
    ? 'Давай сделаем один маленький шаг. Найди фигурку, которой опасно. Потом помоги ей.'
    : 'Сначала добавь одну партию. Потом я дам очень простой совет.';
}

function noDataAnswer(lang: Lang) {
  if (lang === 'en') return 'First import and analyse a few games. Then I can explain your real mistakes, openings, and training priorities.';
  if (lang === 'kk') return 'Алдымен бірнеше партияны жүктеп, талда. Содан кейін нақты қателеріңді, дебюттеріңді және жаттығу жоспарын айта аламын.';
  return 'Сначала загрузи и проанализируй несколько партий. После этого я смогу объяснить реальные ошибки, дебюты и план тренировок.';
}
