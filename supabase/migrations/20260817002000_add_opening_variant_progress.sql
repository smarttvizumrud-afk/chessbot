create table if not exists public.opening_variant_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  opening text not null,
  variant text not null,
  successful_attempts int not null default 0,
  error_count int not null default 0,
  status text not null default 'training' check (status in ('training', 'completed')),
  last_trained_at timestamptz not null default now(),
  unique (user_id, opening, variant)
);

alter table public.opening_variant_progress enable row level security;

create policy "read own opening variant progress" on public.opening_variant_progress
  for select using (auth.uid() = user_id);

create policy "insert own opening variant progress" on public.opening_variant_progress
  for insert with check (auth.uid() = user_id);

create policy "update own opening variant progress" on public.opening_variant_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "delete own opening variant progress" on public.opening_variant_progress
  for delete using (auth.uid() = user_id);
