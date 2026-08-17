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
  solved_at: string | null;
  earned_rating: number;
  created_at: string;
};

type ProfileRatingRow = {
  id: string;
  puzzle_rating: number | null;
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

export async function awardPuzzleRating(puzzle: StoredPuzzle) {
  const ratingGain = ratingGainFor(puzzle);
  if (isGuestMode()) return { puzzle: { ...puzzle, earnedRating: ratingGain }, ratingGain };

  const { data, error } = await supabase
    .from('training_puzzles')
    .update({ solved_at: new Date().toISOString(), earned_rating: ratingGain })
    .eq('id', puzzle.id)
    .is('solved_at', null)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  if (!data) return { puzzle, ratingGain: 0 };

  await addRatingToLatestProfile(ratingGain);
  return { puzzle: mapPuzzleRow(data as PuzzleRow), ratingGain };
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

async function addRatingToLatestProfile(ratingGain: number) {
  const { data, error } = await supabase
    .from('chess_profiles')
    .select('id,puzzle_rating')
    .order('connected_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return;

  const profile = data as ProfileRatingRow;
  const nextRating = (profile.puzzle_rating ?? 1500) + ratingGain;
  const { error: updateError } = await supabase
    .from('chess_profiles')
    .update({ puzzle_rating: nextRating })
    .eq('id', profile.id);
  if (updateError) throw updateError;
}

function ratingGainFor(puzzle: StoredPuzzle) {
  const difficultyBonus = puzzle.difficulty * 3;
  const ratingBonus = Math.max(0, Math.round((puzzle.rating - 1000) / 200));
  return Math.min(30, Math.max(8, 7 + difficultyBonus + ratingBonus));
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
    solvedAt: row.solved_at ?? undefined,
    earnedRating: row.earned_rating,
    createdAt: row.created_at,
  };
}
