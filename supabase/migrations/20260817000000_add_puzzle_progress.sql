alter table public.chess_profiles
  add column if not exists puzzle_rating int not null default 1500;

alter table public.training_puzzles
  add column if not exists solved_at timestamptz,
  add column if not exists earned_rating int not null default 0;
