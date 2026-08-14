alter table public.training_puzzles
  add column if not exists rating int not null default 800;

update public.training_puzzles
set rating = 600 + difficulty * 300
where rating = 800;
