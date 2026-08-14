import { isGuestMode } from './guestSession';
import { supabase } from './supabase';
import type { PuzzleCandidate } from './puzzleGenerator';
import type { StoredPuzzle } from './types';

type PuzzleRow = {
  id: string;
  game_id: string;
  analysis_id: string;
  fen: string;
  best_move: string;
  solution: string[];
  side_to_move: 'white' | 'black';
  theme: string;
  difficulty: number;
  rating: number;
  source_ply: number;
  source_move: string;
  explanation: string;
  created_at: string;
};

export async function loadPuzzles() {
  if (isGuestMode()) return [];
  const { data, error } = await supabase
    .from('training_puzzles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as PuzzleRow[]).map(mapPuzzleRow);
}

export async function saveGeneratedPuzzles(puzzles: PuzzleCandidate[]) {
  if (isGuestMode() || !puzzles.length) return [];
  const { data, error } = await supabase
    .from('training_puzzles')
    .upsert(puzzles.map(toPuzzleRow), { onConflict: 'user_id,analysis_id,source_ply' })
    .select('*');
  if (error) throw error;
  return (data as PuzzleRow[]).map(mapPuzzleRow);
}

function toPuzzleRow(puzzle: PuzzleCandidate) {
  return {
    game_id: puzzle.gameId,
    analysis_id: puzzle.analysisId,
    fen: puzzle.fen,
    best_move: puzzle.bestMove,
    solution: puzzle.solution,
    side_to_move: puzzle.sideToMove,
    theme: puzzle.theme,
    difficulty: puzzle.difficulty,
    rating: puzzle.rating,
    source_ply: puzzle.sourcePly,
    source_move: puzzle.sourceMove,
    explanation: puzzle.explanation,
  };
}

function mapPuzzleRow(row: PuzzleRow): StoredPuzzle {
  return {
    id: row.id,
    gameId: row.game_id,
    analysisId: row.analysis_id,
    fen: row.fen,
    bestMove: row.best_move,
    solution: row.solution,
    sideToMove: row.side_to_move,
    theme: row.theme,
    difficulty: row.difficulty,
    rating: row.rating,
    sourcePly: row.source_ply,
    sourceMove: row.source_move,
    explanation: row.explanation,
    createdAt: row.created_at,
  };
}
