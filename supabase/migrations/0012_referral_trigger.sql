-- The client can't insert into referrals itself at sign-up time: email confirmation is
-- required, so there's no authenticated session yet when signUp() resolves, and RLS
-- rightly blocks an anonymous insert. Passing the referral as signup metadata and writing
-- it via a trigger on auth.users sidesteps that entirely -- it fires the moment the account
-- row is created, confirmed or not, running with the privileges to bypass RLS.
create or replace function public.handle_new_user_referral()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.raw_user_meta_data ? 'referral_animal_id' then
    insert into public.referrals (referred_user_id, referrer_user_id, animal_id)
    values (
      new.id,
      nullif(new.raw_user_meta_data ->> 'referral_referrer_id', '')::uuid,
      nullif(new.raw_user_meta_data ->> 'referral_animal_id', '')::uuid
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_referral on auth.users;
create trigger on_auth_user_created_referral
  after insert on auth.users
  for each row execute function public.handle_new_user_referral();
