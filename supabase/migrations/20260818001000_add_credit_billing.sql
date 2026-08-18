create table if not exists public.credit_balances (
  user_id uuid primary key references auth.users (id) on delete cascade,
  balance int not null default 0 check (balance >= 0),
  unlimited_until timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('grant', 'spend', 'refund')),
  source text not null check (source in ('polar', 'system')),
  product_key text,
  delta int not null,
  polar_event_id text unique,
  polar_order_id text unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.polar_checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_key text not null,
  polar_checkout_id text not null unique,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.credit_balances enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.polar_checkout_sessions enable row level security;

create policy "read own credit balance" on public.credit_balances
  for select using (auth.uid() = user_id);

create policy "read own credit transactions" on public.credit_transactions
  for select using (auth.uid() = user_id);

create policy "read own polar checkouts" on public.polar_checkout_sessions
  for select using (auth.uid() = user_id);

create index if not exists credit_transactions_user_created_idx
  on public.credit_transactions (user_id, created_at desc);

create index if not exists polar_checkout_sessions_user_created_idx
  on public.polar_checkout_sessions (user_id, created_at desc);

create or replace function public.apply_polar_credit_grant(
  p_user_id uuid,
  p_product_key text,
  p_delta int,
  p_unlimited_until timestamptz,
  p_polar_event_id text,
  p_polar_order_id text,
  p_metadata jsonb
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_id uuid;
begin
  insert into public.credit_transactions (
    user_id,
    kind,
    source,
    product_key,
    delta,
    polar_event_id,
    polar_order_id,
    metadata
  )
  values (
    p_user_id,
    'grant',
    'polar',
    p_product_key,
    p_delta,
    p_polar_event_id,
    p_polar_order_id,
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict do nothing
  returning id into inserted_id;

  if inserted_id is null then
    return false;
  end if;

  insert into public.credit_balances (user_id, balance, unlimited_until, updated_at)
  values (p_user_id, greatest(p_delta, 0), p_unlimited_until, now())
  on conflict (user_id) do update
    set balance = public.credit_balances.balance + greatest(p_delta, 0),
        unlimited_until = case
          when excluded.unlimited_until is null then public.credit_balances.unlimited_until
          when public.credit_balances.unlimited_until is null then excluded.unlimited_until
          else greatest(public.credit_balances.unlimited_until, excluded.unlimited_until)
        end,
        updated_at = now();

  return true;
end;
$$;

revoke all on function public.apply_polar_credit_grant(
  uuid,
  text,
  int,
  timestamptz,
  text,
  text,
  jsonb
) from public;

grant execute on function public.apply_polar_credit_grant(
  uuid,
  text,
  int,
  timestamptz,
  text,
  text,
  jsonb
) to service_role;
