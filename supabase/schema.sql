-- ============================================================
-- Kalshi4Family Database Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  name text not null,
  avatar_url text,
  permanent_points integer not null default 1000,
  weekly_points integer not null default 0,
  is_approved boolean not null default false,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Markets
create table public.markets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  close_date timestamptz not null,
  status text not null default 'open' check (status in ('open','locked','resolved','disputed','cancelled')),
  outcome boolean,
  yes_pool integer not null default 0,
  no_pool integer not null default 0,
  category text not null default 'General',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Bets
create table public.bets (
  id uuid primary key default gen_random_uuid(),
  market_id uuid references public.markets(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  position boolean not null,
  amount integer not null check (amount > 0),
  weekly_points_used integer not null default 0,
  permanent_points_used integer not null default 0,
  payout integer,
  created_at timestamptz not null default now(),
  unique(market_id, user_id)
);

-- Comments
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  market_id uuid references public.markets(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  parent_id uuid references public.comments(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Disputes
create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  market_id uuid references public.markets(id) on delete cascade not null,
  challenger_id uuid references public.profiles(id) on delete cascade not null,
  reason text not null,
  status text not null default 'pending' check (status in ('pending','resolved','dismissed')),
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text not null default 'info' check (type in ('info','win','loss','dispute','system')),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.markets enable row level security;
alter table public.bets enable row level security;
alter table public.comments enable row level security;
alter table public.disputes enable row level security;
alter table public.notifications enable row level security;

-- Profiles
create policy "profiles_select" on public.profiles for select using (auth.role() = 'authenticated');
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Markets
create policy "markets_select" on public.markets for select using (auth.role() = 'authenticated');
create policy "markets_insert" on public.markets for insert with check (
  auth.uid() = creator_id and
  exists (select 1 from public.profiles where id = auth.uid() and is_approved = true)
);
create policy "markets_update" on public.markets for update using (
  auth.uid() = creator_id or
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- Bets
create policy "bets_select" on public.bets for select using (auth.role() = 'authenticated');
create policy "bets_insert" on public.bets for insert with check (
  auth.uid() = user_id and
  exists (select 1 from public.profiles where id = auth.uid() and is_approved = true)
);
create policy "bets_update" on public.bets for update using (auth.role() = 'authenticated');

-- Comments
create policy "comments_select" on public.comments for select using (auth.role() = 'authenticated');
create policy "comments_insert" on public.comments for insert with check (
  auth.uid() = user_id and
  exists (select 1 from public.profiles where id = auth.uid() and is_approved = true)
);
create policy "comments_delete" on public.comments for delete using (
  auth.uid() = user_id or
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- Disputes
create policy "disputes_select" on public.disputes for select using (auth.role() = 'authenticated');
create policy "disputes_insert" on public.disputes for insert with check (
  auth.uid() = challenger_id and
  exists (select 1 from public.profiles where id = auth.uid() and is_approved = true)
);
create policy "disputes_update" on public.disputes for update using (auth.role() = 'authenticated');

-- Notifications
create policy "notifications_select" on public.notifications for select using (auth.uid() = user_id);
create policy "notifications_update" on public.notifications for update using (auth.uid() = user_id);
create policy "notifications_insert" on public.notifications for insert with check (auth.role() = 'authenticated');

-- ============================================================
-- Functions & Triggers
-- ============================================================

-- Auto-create profile on signup; first user = admin + approved
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  user_count integer;
begin
  select count(*) into user_count from public.profiles;
  insert into public.profiles (id, email, name, is_approved, is_admin, permanent_points, weekly_points)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    user_count = 0,
    user_count = 0,
    1000,
    0
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-lock markets past close_date
create or replace function public.lock_expired_markets()
returns void language plpgsql security definer as $$
begin
  update public.markets
  set status = 'locked', updated_at = now()
  where status = 'open' and close_date <= now();
end;
$$;

-- Distribute weekly allowance (called by cron)
create or replace function public.distribute_weekly_allowance()
returns void language plpgsql security definer as $$
begin
  update public.profiles
  set weekly_points = 100, updated_at = now()
  where is_approved = true;
end;
$$;

-- ============================================================
-- Indexes
-- ============================================================

create index idx_markets_status on public.markets(status);
create index idx_markets_close_date on public.markets(close_date);
create index idx_markets_creator on public.markets(creator_id);
create index idx_bets_market on public.bets(market_id);
create index idx_bets_user on public.bets(user_id);
create index idx_comments_market on public.comments(market_id);
create index idx_comments_parent on public.comments(parent_id);
create index idx_notifications_user on public.notifications(user_id, read);
create index idx_disputes_market on public.disputes(market_id);
