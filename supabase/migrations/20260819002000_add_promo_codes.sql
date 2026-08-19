create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  credits int not null check (credits > 0),
  active boolean not null default true,
  max_redemptions int check (max_redemptions is null or max_redemptions > 0),
  max_redemptions_per_user int not null default 1 check (max_redemptions_per_user > 0),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  promo_code_id uuid not null references public.promo_codes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  credits int not null check (credits > 0),
  created_at timestamptz not null default now()
);

alter table public.promo_codes enable row level security;
alter table public.promo_redemptions enable row level security;

drop policy if exists "read own promo redemptions" on public.promo_redemptions;
create policy "read own promo redemptions" on public.promo_redemptions
  for select using (auth.uid() = user_id);

create index if not exists promo_codes_code_idx
  on public.promo_codes (upper(code));

create index if not exists promo_redemptions_user_created_idx
  on public.promo_redemptions (user_id, created_at desc);

create or replace function public.redeem_promo_code(
  p_user_id uuid,
  p_code text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  promo public.promo_codes%rowtype;
  user_uses int;
  total_uses int;
begin
  select *
    into promo
    from public.promo_codes
    where upper(code) = upper(trim(p_code))
    for update;

  if promo.id is null then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if not promo.active then
    return jsonb_build_object('ok', false, 'reason', 'inactive');
  end if;

  if promo.starts_at is not null and promo.starts_at > now() then
    return jsonb_build_object('ok', false, 'reason', 'not_started');
  end if;

  if promo.ends_at is not null and promo.ends_at < now() then
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;

  select count(*) into user_uses
    from public.promo_redemptions
    where promo_code_id = promo.id and user_id = p_user_id;

  if user_uses >= promo.max_redemptions_per_user then
    return jsonb_build_object('ok', false, 'reason', 'already_used');
  end if;

  if promo.max_redemptions is not null then
    select count(*) into total_uses
      from public.promo_redemptions
      where promo_code_id = promo.id;

    if total_uses >= promo.max_redemptions then
      return jsonb_build_object('ok', false, 'reason', 'limit_reached');
    end if;
  end if;

  insert into public.promo_redemptions (promo_code_id, user_id, credits)
  values (promo.id, p_user_id, promo.credits);

  insert into public.credit_transactions (
    user_id,
    kind,
    source,
    product_key,
    delta,
    metadata
  )
  values (
    p_user_id,
    'grant',
    'system',
    'promo_code',
    promo.credits,
    jsonb_build_object('promo_code_id', promo.id, 'code', promo.code)
  );

  insert into public.credit_balances (user_id, balance, updated_at)
  values (p_user_id, promo.credits, now())
  on conflict (user_id) do update
    set balance = public.credit_balances.balance + promo.credits,
        updated_at = now();

  return jsonb_build_object('ok', true, 'credits', promo.credits);
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'reason', 'already_used');
end;
$$;

revoke all on function public.redeem_promo_code(uuid, text) from public;
grant execute on function public.redeem_promo_code(uuid, text) to service_role;
