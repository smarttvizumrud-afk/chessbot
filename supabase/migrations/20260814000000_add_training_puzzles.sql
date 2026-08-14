create table if not exists public.training_puzzles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  game_id uuid not null references public.chess_games (id) on delete cascade,
  analysis_id uuid not null references public.chess_analyses (id) on delete cascade,
  fen text not null,
  best_move text not null,
  solution text[] not null default '{}',
  side_to_move text not null check (side_to_move in ('white', 'black')),
  theme text not null,
  difficulty int not null default 1 check (difficulty between 1 and 5),
  source_ply int not null,
  source_move text not null,
  explanation text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, analysis_id, source_ply)
);

alter table public.training_puzzles enable row level security;

create policy "read own training puzzles" on public.training_puzzles
  for select using (auth.uid() = user_id);

create policy "insert own training puzzles" on public.training_puzzles
  for insert with check (auth.uid() = user_id);

create policy "update own training puzzles" on public.training_puzzles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "delete own training puzzles" on public.training_puzzles
  for delete using (auth.uid() = user_id);
