import { isGuestMode } from './guestSession';
import { supabase } from './supabase';
import { markGamePuzzleStatus } from './storage';
import type { PuzzleCandidate } from './puzzleGenerator';
import type { StoredGame, StoredPuzzle } from './types';

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
  return onePuzzlePerGame((data as PuzzleRow[]).map(mapPuzzleRow));
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
  const bestPuzzles = oneCandidatePerGame(puzzles);
  const { error } = await supabase
    .from('training_puzzles')
    .upsert(bestPuzzles.map(toPuzzleRow), { onConflict: 'user_id,game_id' });
  if (error) throw error;
  return cleanupDuplicatePuzzles(bestPuzzles.map((puzzle) => puzzle.gameId));
}

export async function savePuzzleResultForGame(game: StoredGame, puzzles: PuzzleCandidate[]) {
  const puzzle = oneCandidatePerGame(puzzles.filter((item) => item.gameId === game.id))[0];
  if (!puzzle) {
    await markGamePuzzleStatus(game.id, 'no_puzzle');
    return [];
  }

  const saved = await saveGeneratedPuzzles([puzzle]);
  await markGamePuzzleStatus(game.id, 'created');
  return saved;
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

async function cleanupDuplicatePuzzles(gameIds: string[]) {
  const uniqueGameIds = [...new Set(gameIds)];
  if (!uniqueGameIds.length) return [];

  const { data, error } = await supabase
    .from('training_puzzles')
    .select('*')
    .in('game_id', uniqueGameIds);
  if (error) throw error;

  const puzzles = onePuzzlePerGame((data as PuzzleRow[]).map(mapPuzzleRow));
  const keepIds = new Set(puzzles.map((puzzle) => puzzle.id));
  const deleteIds = (data as PuzzleRow[])
    .map((row) => row.id)
    .filter((id) => !keepIds.has(id));

  if (deleteIds.length) {
    const { error: deleteError } = await supabase
      .from('training_puzzles')
      .delete()
      .in('id', deleteIds);
    if (deleteError) throw deleteError;
  }

  return puzzles;
}

function oneCandidatePerGame(puzzles: PuzzleCandidate[]) {
  const byGame = new Map<string, PuzzleCandidate>();
  puzzles.forEach((puzzle) => {
    const current = byGame.get(puzzle.gameId);
    if (!current || puzzle.rating > current.rating) byGame.set(puzzle.gameId, puzzle);
  });
  return [...byGame.values()];
}

function onePuzzlePerGame(puzzles: StoredPuzzle[]) {
  const byGame = new Map<string, StoredPuzzle>();
  puzzles.forEach((puzzle) => {
    const current = byGame.get(puzzle.gameId);
    if (!current || shouldPreferPuzzle(puzzle, current)) byGame.set(puzzle.gameId, puzzle);
  });
  return [...byGame.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

function shouldPreferPuzzle(next: StoredPuzzle, current: StoredPuzzle) {
  if (Boolean(next.solvedAt) !== Boolean(current.solvedAt)) return Boolean(next.solvedAt);
  if (next.rating !== current.rating) return next.rating > current.rating;
  return Date.parse(next.createdAt) > Date.parse(current.createdAt);
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
