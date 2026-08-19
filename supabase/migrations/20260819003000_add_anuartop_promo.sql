do $$
declare
  existing_id uuid;
begin
  select id
    into existing_id
    from public.promo_codes
    where upper(code) = 'ANUARTOP'
    limit 1;

  if existing_id is null then
    insert into public.promo_codes (
      code,
      credits,
      active,
      max_redemptions,
      max_redemptions_per_user
    )
    values (
      'anuartop',
      200,
      true,
      null,
      1
    );
  else
    update public.promo_codes
      set code = 'anuartop',
          credits = 200,
          active = true,
          max_redemptions = null,
          max_redemptions_per_user = 1
      where id = existing_id;
  end if;
end;
$$;
