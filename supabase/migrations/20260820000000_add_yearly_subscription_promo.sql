alter table public.promo_codes
  add column if not exists grants_subscription boolean not null default false,
  add column if not exists subscription_days int not null default 365
    check (subscription_days > 0);

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
  next_period_end timestamptz;
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

  if promo.max_redemptions_per_user is not null then
    select count(*) into user_uses
      from public.promo_redemptions
      where promo_code_id = promo.id and user_id = p_user_id;

    if user_uses >= promo.max_redemptions_per_user then
      return jsonb_build_object('ok', false, 'reason', 'already_used');
    end if;
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
  values (promo.id, p_user_id, greatest(promo.credits, 1));

  if promo.credits > 0 then
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
  end if;

  if promo.grants_subscription then
    next_period_end := now() + make_interval(days => promo.subscription_days);

    insert into public.user_subscriptions (
      user_id,
      product_key,
      status,
      cancel_at_period_end,
      current_period_start,
      current_period_end,
      revoked_at,
      updated_at
    )
    values (
      p_user_id,
      'unlimited_year',
      'active',
      false,
      now(),
      next_period_end,
      null,
      now()
    )
    on conflict (user_id) do update
      set product_key = excluded.product_key,
          status = 'active',
          cancel_at_period_end = false,
          current_period_start = now(),
          current_period_end = greatest(
            coalesce(public.user_subscriptions.current_period_end, now()),
            next_period_end
          ),
          revoked_at = null,
          updated_at = now();
  end if;

  return jsonb_build_object(
    'ok', true,
    'credits', promo.credits,
    'subscription', promo.grants_subscription,
    'subscription_days', promo.subscription_days
  );
end;
$$;

revoke all on function public.redeem_promo_code(uuid, text) from public;
grant execute on function public.redeem_promo_code(uuid, text) to service_role;

insert into public.promo_codes (
  code,
  credits,
  active,
  max_redemptions,
  max_redemptions_per_user,
  grants_subscription,
  subscription_days
)
values (
  'YEARTEST',
  1,
  true,
  null,
  1,
  true,
  365
)
on conflict (code) do update
  set credits = 1,
      active = true,
      max_redemptions = null,
      max_redemptions_per_user = 1,
      grants_subscription = true,
      subscription_days = 365;
