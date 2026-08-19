alter table public.promo_codes
  alter column max_redemptions_per_user drop not null;

alter table public.promo_codes
  drop constraint if exists promo_codes_max_redemptions_per_user_check;

alter table public.promo_codes
  add constraint promo_codes_max_redemptions_per_user_check
  check (max_redemptions_per_user is null or max_redemptions_per_user > 0);

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
end;
$$;

revoke all on function public.redeem_promo_code(uuid, text) from public;
grant execute on function public.redeem_promo_code(uuid, text) to service_role;

update public.promo_codes
  set active = true,
      credits = 200,
      max_redemptions = null,
      max_redemptions_per_user = null
  where upper(code) = 'ANUARTOP';
