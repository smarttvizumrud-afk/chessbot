alter table public.chess_games
  add column if not exists player_rating int;
