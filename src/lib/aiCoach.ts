import { supabase } from './supabase';
import type { Lang, StoredAnalysis, StoredGame } from './types';
import { combinedPlan, dashboardStats, openingStats } from './insights';

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
) {
  const context = buildContext(games, analyses);
  const system = `You are a personal chess coach powered by Gemini. Answer in ${languageName[lang]}. Use only the supplied player data, Stockfish results, openings, weaknesses, and chat history. Be concrete, kind, and concise.`;
  const prompt = `${context}\n\nChat history:\n${formatHistory(history)}\n\nUser question: ${question}`;
  const { data, error } = await supabase.functions.invoke('ai', { body: { prompt, system } });
  if (error) return fallbackAnswer(lang, analyses);
  const text = readText(data);
  return text || fallbackAnswer(lang, analyses);
}

function formatHistory(history: CoachMessage[]) {
  return history
    .slice(-8)
    .map((message) => `${message.role}: ${message.text}`)
    .join('\n');
}

export async function coachSummary(lang: Lang, games: StoredGame[], analyses: StoredAnalysis[]) {
  return askCoach('What should I improve first and why?', lang, games, analyses);
}

function buildContext(games: StoredGame[], analyses: StoredAnalysis[]) {
  const stats = dashboardStats(games, analyses);
  const openings = openingStats(games, analyses).slice(0, 5);
  const plan = combinedPlan(analyses);
  return JSON.stringify({ stats, openings, plan, games: games.slice(0, 10) });
}

function readText(data: unknown) {
  if (typeof data === 'object' && data && 'text' in data) {
    const value = (data as { text?: unknown }).text;
    return typeof value === 'string' ? value : '';
  }
  return '';
}

function fallbackAnswer(lang: Lang, analyses: StoredAnalysis[]) {
  const weak = combinedPlan(analyses).slice(0, 3).join(', ');
  if (lang === 'en') return `Start with this training focus: ${weak || 'analyse more games first'}.`;
  if (lang === 'kk') return `Алдымен мына бағытты жаттықтыр: ${weak || 'көбірек партия талдау керек'}.`;
  return `Начни с этого фокуса тренировок: ${weak || 'сначала проанализируй больше партий'}.`;
}
