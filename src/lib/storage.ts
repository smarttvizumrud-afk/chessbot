import { supabase } from './supabase';
import {
  isDemoMode,
  loadDemoAnalyses,
  loadDemoGames,
  saveDemoAnalysis,
  saveDemoGame,
} from './demoStorage';
import type { GameAnalysis, ImportedGame, StoredAnalysis, StoredGame } from './types';

type GameRow = {
  id: string;
  platform: 'chesscom' | 'lichess';
  platform_game_id: string;
  username: string;
  opponent: string;
  played_at: string;
  result: 'win' | 'loss' | 'draw';
  color: 'white' | 'black';
  opening: string;
  pgn: string;
  time_control: string;
};

type AnalysisRow = {
  id: string;
  game_id: string;
  accuracy: number;
  inaccuracies: number;
  mistakes: number;
  blunders: number;
  weak_spots: string[];
  training_plan: string[];
  move_reports: unknown;
  ai_summary: string;
};

export async function loadGames() {
  if (isDemoMode()) return loadDemoGames();
  const { data, error } = await supabase
    .from('chess_games')
    .select('*')
    .order('played_at', { ascending: false });
  if (error) throw error;
  return (data as GameRow[]).map(mapGameRow);
}

export async function loadAnalyses() {
  if (isDemoMode()) return loadDemoAnalyses();
  const { data, error } = await supabase.from('chess_analyses').select('*');
  if (error) throw error;
  return (data as AnalysisRow[]).map(mapAnalysisRow);
}

export async function saveGame(game: ImportedGame) {
  if (isDemoMode()) return saveDemoGame(game);
  const { data, error } = await supabase
    .from('chess_games')
    .upsert(toGameRow(game), { onConflict: 'user_id,platform,platform_game_id' })
    .select('*')
    .single();
  if (error) throw error;
  return mapGameRow(data as GameRow);
}

export async function saveAnalysis(gameId: string, analysis: GameAnalysis) {
  if (isDemoMode()) return saveDemoAnalysis(gameId, analysis);
  const row = {
    game_id: gameId,
    accuracy: analysis.accuracy,
    inaccuracies: analysis.inaccuracies,
    mistakes: analysis.mistakes,
    blunders: analysis.blunders,
    weak_spots: analysis.weakSpots,
    training_plan: analysis.trainingPlan,
    move_reports: analysis.moveReports,
    ai_summary: analysis.aiSummary,
  };
  const { data, error } = await supabase
    .from('chess_analyses')
    .upsert(row, { onConflict: 'user_id,game_id' })
    .select('*')
    .single();
  if (error) throw error;
  return mapAnalysisRow(data as AnalysisRow);
}

function toGameRow(game: ImportedGame) {
  return {
    platform: game.platform,
    platform_game_id: game.platformGameId,
    username: game.username,
    opponent: game.opponent,
    played_at: game.playedAt,
    result: game.result,
    color: game.color,
    opening: game.opening,
    pgn: game.pgn,
    time_control: game.timeControl,
  };
}

function mapGameRow(row: GameRow): StoredGame {
  return {
    id: row.id,
    platform: row.platform,
    platformGameId: row.platform_game_id,
    username: row.username,
    opponent: row.opponent,
    playedAt: row.played_at,
    result: row.result,
    color: row.color,
    opening: row.opening,
    pgn: row.pgn,
    timeControl: row.time_control,
  };
}

function mapAnalysisRow(row: AnalysisRow): StoredAnalysis {
  return {
    id: row.id,
    gameId: row.game_id,
    accuracy: Number(row.accuracy),
    inaccuracies: row.inaccuracies,
    mistakes: row.mistakes,
    blunders: row.blunders,
    weakSpots: row.weak_spots,
    trainingPlan: row.training_plan,
    moveReports: row.move_reports as StoredAnalysis['moveReports'],
    aiSummary: row.ai_summary,
  };
}
