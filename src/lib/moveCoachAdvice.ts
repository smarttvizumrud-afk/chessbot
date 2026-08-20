import { coachPersona } from './coachPersona';
import { localizeInsight } from './i18n';
import { supabase } from './supabase';
import type { Lang, MoveReport } from './types';
import type { Gender, InterfaceMode } from './userOnboarding';

const languageName: Record<Lang, string> = {
  ru: 'Russian',
  en: 'English',
  kk: 'Kazakh',
};

export async function generateMoveCoachAdvice(
  report: MoveReport,
  lang: Lang,
  interfaceMode: InterfaceMode,
  gender: Gender,
  userAge?: number,
  variant = 0,
) {
  const persona = coachPersona(interfaceMode, gender, lang, userAge);
  const system = [
    `You are ${persona.name}, a friendly chess coach. Answer in ${languageName[lang]}.`,
    'Write like a real person sitting next to the player, not like a formal engine report.',
    'Give 1 or 2 short sentences. No markdown. No bullet points. No greeting. No name prefix.',
    'Do not reuse stock phrases like "I like this move" every time. Vary the wording naturally.',
    lang === 'kk' ? 'Use Kazakh Cyrillic only. Do not use Latin transliteration.' : '',
  ].filter(Boolean).join(' ');

  const prompt = JSON.stringify({
    seed: `${Date.now()}-${variant}-${Math.random().toString(36).slice(2)}`,
    playerAge: userAge ?? null,
    move: report.san,
    bestMove: report.bestMove,
    quality: report.label,
    theme: localizeInsight(report.theme, lang),
    phase: report.phase,
    centipawnLoss: Math.round(report.loss),
    instruction: report.label === 'good'
      ? 'Say why this move is okay in a calm, human way, then give one tiny next-check idea.'
      : 'Explain gently what became risky and mention the better move without sounding robotic.',
  });

  const { data, error } = await supabase.functions.invoke('ai', {
    body: { prompt, system, temperature: 0.95 },
  });

  if (error) throw new Error(error.message);
  const text = readText(data);
  if (!text) throw new Error('AI returned no move advice.');
  return stripPersonaPrefix(text, persona.name);
}

function readText(data: unknown) {
  if (!data || typeof data !== 'object') return '';
  const value = (data as { text?: unknown }).text;
  return typeof value === 'string' ? value.trim() : '';
}

function stripPersonaPrefix(text: string, name: string) {
  return text
    .replace(new RegExp(`^${escapeRegExp(name)}\\s*:\\s*`, 'i'), '')
    .replace(/^["'«»]+|["'«»]+$/g, '')
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
