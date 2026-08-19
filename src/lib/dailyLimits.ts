import { isGuestMode } from './guestSession';
import { supabase } from './supabase';

export const FREE_DAILY_ANALYSIS_LIMIT = 10;
export const FREE_DAILY_TOURNAMENT_LIMIT = 2;

export type DailyUsage = {
  analyses: number;
  tournamentGames: number;
};

export async function loadDailyUsage(): Promise<DailyUsage> {
  if (isGuestMode()) return { analyses: 0, tournamentGames: 0 };
  const today = startOfTodayIso();

  const [analysisResult, tournamentResult] = await Promise.all([
    supabase
      .from('chess_analyses')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', today),
    supabase
      .from('chess_games')
      .select('id', { count: 'exact', head: true })
      .eq('time_control', 'tournament')
      .gte('played_at', today),
  ]);

  if (analysisResult.error) throw analysisResult.error;
  if (tournamentResult.error) throw tournamentResult.error;

  return {
    analyses: analysisResult.count ?? 0,
    tournamentGames: tournamentResult.count ?? 0,
  };
}

function startOfTodayIso() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString();
}
