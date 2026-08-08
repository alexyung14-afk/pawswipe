-- Growth loop tracking (see docs/PLAN.md section 15): what share of new signups
-- arrive via a shared animal link.
create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  referred_user_id uuid not null references auth.users (id) on delete cascade,
  referrer_user_id uuid references auth.users (id) on delete set null,
  animal_id uuid references animals (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table referrals enable row level security;
create policy "users record their own referral" on referrals
  for insert with check (auth.uid() = referred_user_id);
