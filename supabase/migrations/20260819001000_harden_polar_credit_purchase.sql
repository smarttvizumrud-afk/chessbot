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
