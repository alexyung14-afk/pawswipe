-- Pawswipe data model (see docs/PLAN.md section 9)

create table if not exists dogs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  breed text,
  age_years numeric,
  size text check (size in ('small', 'medium', 'large')),
  photos text[] not null default '{}',
  description text,
  source_provider text not null,
  source_listing_id text not null,
  status text not null default 'available' check (status in ('available', 'pending', 'adopted')),
  shelter_name text,
  shelter_contact jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_provider, source_listing_id)
);

create table if not exists adopter_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade unique,
  housing_type text,
  has_yard boolean,
  yard_fenced boolean,
  work_schedule text,
  household_members jsonb,
  pet_experience text,
  "references" jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists shortlist_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  dog_id uuid not null references dogs (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, dog_id)
);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  dog_id uuid not null references dogs (id) on delete cascade,
  shelter_name text,
  submitted_data jsonb,
  status text not null default 'submitted' check (status in ('submitted', 'no_response', 'update_received')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Dogs are public read (shown to every swiper); only the backend sync job
-- (using the service role key, which bypasses RLS) writes to this table.
alter table dogs enable row level security;
create policy "dogs are publicly readable" on dogs for select using (true);

-- Everything else is private to the user it belongs to.
alter table adopter_profiles enable row level security;
create policy "users manage their own profile" on adopter_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table shortlist_entries enable row level security;
create policy "users manage their own shortlist" on shortlist_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table applications enable row level security;
create policy "users manage their own applications" on applications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
