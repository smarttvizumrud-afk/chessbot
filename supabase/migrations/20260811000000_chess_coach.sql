create table if not exists public.chess_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  platform text not null check (platform in ('chesscom', 'lichess')),
  username text not null,
  rating int,
  connected_at timestamptz not null default now(),
  unique (user_id, platform, username)
);

create table if not exists public.chess_games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  platform text not null check (platform in ('chesscom', 'lichess')),
  platform_game_id text not null,
  username text not null,
  opponent text not null,
  played_at timestamptz not null,
  result text not null check (result in ('win', 'loss', 'draw')),
  color text not null check (color in ('white', 'black')),
  opening text not null default 'Unknown opening',
  pgn text not null,
  time_control text not null default 'unknown',
  unique (user_id, platform, platform_game_id)
);

create table if not exists public.chess_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  game_id uuid not null references public.chess_games (id) on delete cascade,
  accuracy numeric not null,
  inaccuracies int not null default 0,
  mistakes int not null default 0,
  blunders int not null default 0,
  weak_spots text[] not null default '{}',
  training_plan jsonb not null default '[]'::jsonb,
  move_reports jsonb not null default '[]'::jsonb,
  ai_summary text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, game_id)
);

alter table public.chess_profiles enable row level security;
alter table public.chess_games enable row level security;
alter table public.chess_analyses enable row level security;

create policy "read own chess profiles" on public.chess_profiles
  for select using (auth.uid() = user_id);
create policy "insert own chess profiles" on public.chess_profiles
  for insert with check (auth.uid() = user_id);
create policy "update own chess profiles" on public.chess_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own chess profiles" on public.chess_profiles
  for delete using (auth.uid() = user_id);

create policy "read own chess games" on public.chess_games
  for select using (auth.uid() = user_id);
create policy "insert own chess games" on public.chess_games
  for insert with check (auth.uid() = user_id);
create policy "update own chess games" on public.chess_games
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own chess games" on public.chess_games
  for delete using (auth.uid() = user_id);

create policy "read own chess analyses" on public.chess_analyses
  for select using (auth.uid() = user_id);
create policy "insert own chess analyses" on public.chess_analyses
  for insert with check (auth.uid() = user_id);
create policy "update own chess analyses" on public.chess_analyses
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own chess analyses" on public.chess_analyses
  for delete using (auth.uid() = user_id);
