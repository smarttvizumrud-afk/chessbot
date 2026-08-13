create table if not exists public.pinned_openings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  opening text not null,
  created_at timestamptz not null default now(),
  unique (user_id, opening)
);

alter table public.pinned_openings enable row level security;

create policy "read own pinned openings" on public.pinned_openings
  for select using (auth.uid() = user_id);

create policy "insert own pinned openings" on public.pinned_openings
  for insert with check (auth.uid() = user_id);

create policy "delete own pinned openings" on public.pinned_openings
  for delete using (auth.uid() = user_id);
