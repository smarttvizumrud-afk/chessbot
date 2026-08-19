create table if not exists public.polar_webhook_events (
  event_id text primary key,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.user_subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  product_key text not null default 'yearly',
  polar_subscription_id text unique,
  polar_customer_id text,
  status text not null default 'inactive',
  cancel_at_period_end boolean not null default false,
  current_period_start timestamptz,
  current_period_end timestamptz,
  revoked_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.polar_checkout_sessions
  add column if not exists polar_product_id text,
  add column if not exists polar_customer_id text,
  add column if not exists polar_subscription_id text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.polar_webhook_events enable row level security;
alter table public.user_subscriptions enable row level security;

drop policy if exists "read own subscription" on public.user_subscriptions;
create policy "read own subscription" on public.user_subscriptions
  for select using (auth.uid() = user_id);

create index if not exists user_subscriptions_status_idx
  on public.user_subscriptions (status, current_period_end);

create index if not exists polar_checkout_sessions_subscription_idx
  on public.polar_checkout_sessions (polar_subscription_id);

create or replace function public.apply_polar_credit_purchase(
  p_event_id text,
  p_event_type text,
  p_user_id uuid,
  p_product_key text,
  p_delta int,
  p_polar_order_id text,
  p_payload jsonb,
  p_metadata jsonb
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_event text;
  inserted_transaction uuid;
begin
  insert into public.polar_webhook_events (event_id, event_type, payload)
  values (p_event_id, p_event_type, coalesce(p_payload, '{}'::jsonb))
  on conflict do nothing
  returning event_id into inserted_event;

  if inserted_event is null then
    return false;
  end if;

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
    p_event_id,
    p_polar_order_id,
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict do nothing
  returning id into inserted_transaction;

  if inserted_transaction is null then
    return false;
  end if;

  insert into public.credit_balances (user_id, balance, updated_at)
  values (p_user_id, greatest(p_delta, 0), now())
  on conflict (user_id) do update
    set balance = public.credit_balances.balance + greatest(p_delta, 0),
        updated_at = now();

  return true;
end;
$$;

create or replace function public.apply_polar_subscription_event(
  p_event_id text,
  p_event_type text,
  p_user_id uuid,
  p_product_key text,
  p_polar_subscription_id text,
  p_polar_customer_id text,
  p_status text,
  p_cancel_at_period_end boolean,
  p_current_period_start timestamptz,
  p_current_period_end timestamptz,
  p_payload jsonb
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_event text;
  resolved_status text;
begin
  insert into public.polar_webhook_events (event_id, event_type, payload)
  values (p_event_id, p_event_type, coalesce(p_payload, '{}'::jsonb))
  on conflict do nothing
  returning event_id into inserted_event;

  if inserted_event is null then
    return false;
  end if;

  resolved_status := case
    when p_event_type = 'subscription.revoked' then 'revoked'
    else coalesce(nullif(p_status, ''), 'inactive')
  end;

  insert into public.user_subscriptions (
    user_id,
    product_key,
    polar_subscription_id,
    polar_customer_id,
    status,
    cancel_at_period_end,
    current_period_start,
    current_period_end,
    revoked_at,
    updated_at
  )
  values (
    p_user_id,
    p_product_key,
    p_polar_subscription_id,
    p_polar_customer_id,
    resolved_status,
    coalesce(p_cancel_at_period_end, false),
    p_current_period_start,
    p_current_period_end,
    case when p_event_type = 'subscription.revoked' then now() else null end,
    now()
  )
  on conflict (user_id) do update
    set product_key = excluded.product_key,
        polar_subscription_id = coalesce(excluded.polar_subscription_id, public.user_subscriptions.polar_subscription_id),
        polar_customer_id = coalesce(excluded.polar_customer_id, public.user_subscriptions.polar_customer_id),
        status = excluded.status,
        cancel_at_period_end = excluded.cancel_at_period_end,
        current_period_start = coalesce(excluded.current_period_start, public.user_subscriptions.current_period_start),
        current_period_end = coalesce(excluded.current_period_end, public.user_subscriptions.current_period_end),
        revoked_at = case
          when p_event_type = 'subscription.revoked' then now()
          when excluded.status in ('active', 'trialing') then null
          else public.user_subscriptions.revoked_at
        end,
        updated_at = now();

  return true;
end;
$$;

create or replace function public.record_polar_webhook_event(
  p_event_id text,
  p_event_type text,
  p_payload jsonb
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_event text;
begin
  insert into public.polar_webhook_events (event_id, event_type, payload)
  values (p_event_id, p_event_type, coalesce(p_payload, '{}'::jsonb))
  on conflict do nothing
  returning event_id into inserted_event;

  return inserted_event is not null;
end;
$$;

revoke all on function public.apply_polar_credit_purchase(
  text,
  text,
  uuid,
  text,
  int,
  text,
  jsonb,
  jsonb
) from public;

revoke all on function public.apply_polar_subscription_event(
  text,
  text,
  uuid,
  text,
  text,
  text,
  text,
  boolean,
  timestamptz,
  timestamptz,
  jsonb
) from public;

revoke all on function public.record_polar_webhook_event(text, text, jsonb) from public;

grant execute on function public.apply_polar_credit_purchase(
  text,
  text,
  uuid,
  text,
  int,
  text,
  jsonb,
  jsonb
) to service_role;

grant execute on function public.apply_polar_subscription_event(
  text,
  text,
  uuid,
  text,
  text,
  text,
  text,
  boolean,
  timestamptz,
  timestamptz,
  jsonb
) to service_role;

grant execute on function public.record_polar_webhook_event(text, text, jsonb) to service_role;
