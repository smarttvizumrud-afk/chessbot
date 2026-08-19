import { supabase } from './supabase';
import { spendCredits } from './credits';
import { buildTrainingSections, type TrainingTask } from './trainingTasks';
import type { Lang, MoveReport, StoredAnalysis, StoredGame } from './types';

export type AiTrainingTask = {
  title: string;
  focus: string;
  instruction: string;
  gameId?: string;
};

const languageName: Record<Lang, string> = {
  ru: 'Russian',
  en: 'English',
  kk: 'Kazakh',
};

export async function generateAiTrainingTasks(
  games: StoredGame[],
  analyses: StoredAnalysis[],
  lang: Lang,
): Promise<AiTrainingTask[]> {
  await spendCredits(1, 'ai_tasks', { feature: 'training_tasks', taskCount: 2 });
  const system = [
    'You are a chess coach that creates short training tasks.',
    `Answer only in ${languageName[lang]}.`,
    'Return JSON only, no markdown.',
    'JSON shape: {"tasks":[{"title":"...","focus":"...","instruction":"...","gameId":"optional"}]}',
  ].join(' ');
  const prompt = buildPrompt(games, analyses);
  const { data, error } = await supabase.functions.invoke('ai', { body: { prompt, system } });
  if (error) throw new Error(error.message);
  const text = readText(data);
  const parsed = parseTasks(text);
  if (!parsed.length) throw new Error('Gemini did not return training tasks.');
  return parsed.slice(0, 2);
}

function buildPrompt(games: StoredGame[], analyses: StoredAnalysis[]) {
  const sections = buildTrainingSections(games, analyses);
  const context = {
    recentGames: games.slice(0, 8).map((game) => ({
      gameId: game.id,
      opponent: game.opponent,
      result: game.result,
      color: game.color,
      opening: game.opening,
      rating: game.playerRating,
    })),
    blunders: sections.blunders.map(taskContext),
    gameMistakes: sections.games.map(taskContext),
    openingTasks: sections.openings.map(taskContext),
  };

  return [
    'Create exactly 2 personal chess training tasks from this player data.',
    'Use concrete wording. Prefer tasks about blunders, recent games, and repeated openings.',
    'Each instruction should be one practical exercise, not general advice.',
    JSON.stringify(context),
  ].join('\n');
}

function taskContext(task: TrainingTask) {
  return {
    gameId: task.gameId,
    opponent: task.opponent,
    opening: task.opening,
    move: task.report ? moveContext(task.report) : undefined,
  };
}

function moveContext(report: MoveReport) {
  return {
    ply: report.ply,
    played: report.san,
    best: report.bestMove,
    label: report.label,
    phase: report.phase,
    theme: report.theme,
    loss: Math.round(report.loss),
  };
}

function readText(data: unknown) {
  if (!data || typeof data !== 'object' || !('text' in data)) return '';
  const value = (data as { text?: unknown }).text;
  return typeof value === 'string' ? value.trim() : '';
}

function parseTasks(text: string): AiTrainingTask[] {
  const jsonText = text.match(/\{[\s\S]*\}/)?.[0] ?? text;
  const parsed = JSON.parse(jsonText) as unknown;
  if (!isTaskResponse(parsed)) return [];
  return parsed.tasks.filter(isTask);
}

function isTaskResponse(value: unknown): value is { tasks: unknown[] } {
  return Boolean(value && typeof value === 'object' && Array.isArray((value as { tasks?: unknown }).tasks));
}

function isTask(value: unknown): value is AiTrainingTask {
  if (!value || typeof value !== 'object') return false;
  const task = value as Record<string, unknown>;
  return typeof task.title === 'string'
    && typeof task.focus === 'string'
    && typeof task.instruction === 'string'
    && (task.gameId === undefined || typeof task.gameId === 'string');
}
