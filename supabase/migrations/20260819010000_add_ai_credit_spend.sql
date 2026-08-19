create or replace function public.spend_user_credits(
  p_amount int,
  p_product_key text,
  p_metadata jsonb default '{}'::jsonb
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  updated_rows int;
begin
  if current_user_id is null then
    return false;
  end if;

  if p_amount <= 0 then
    return true;
  end if;

  update public.credit_balances
    set balance = balance - p_amount,
        updated_at = now()
    where user_id = current_user_id
      and balance >= p_amount;

  get diagnostics updated_rows = row_count;

  if updated_rows = 0 then
    return false;
  end if;

  insert into public.credit_transactions (
    user_id,
    kind,
    source,
    product_key,
    delta,
    metadata
  )
  values (
    current_user_id,
    'spend',
    'system',
    p_product_key,
    -p_amount,
    coalesce(p_metadata, '{}'::jsonb)
  );

  return true;
end;
$$;

revoke all on function public.spend_user_credits(int, text, jsonb) from public;
grant execute on function public.spend_user_credits(int, text, jsonb) to authenticated;
