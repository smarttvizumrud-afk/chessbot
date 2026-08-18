alter table public.chess_games
  add column if not exists puzzle_status text not null default 'pending';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chess_games_puzzle_status_check'
  ) then
    alter table public.chess_games
      add constraint chess_games_puzzle_status_check
      check (puzzle_status in ('pending', 'created', 'no_puzzle'));
  end if;
end $$;

with ranked as (
  select
    id,
    row_number() over (
      partition by user_id, game_id
      order by (solved_at is not null) desc, rating desc, created_at desc
    ) as row_number
  from public.training_puzzles
)
delete from public.training_puzzles
where id in (
  select id from ranked where row_number > 1
);

create unique index if not exists training_puzzles_one_per_game
  on public.training_puzzles (user_id, game_id);
