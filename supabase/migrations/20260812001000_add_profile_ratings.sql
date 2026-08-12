alter table public.chess_profiles
  add column if not exists classical_rating int,
  add column if not exists rapid_rating int,
  add column if not exists blitz_rating int;
