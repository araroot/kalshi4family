-- ============================================================
-- Migration: odds history for trend charts
-- Run this in Supabase SQL Editor
-- ============================================================

create table public.market_odds_history (
  id uuid primary key default gen_random_uuid(),
  market_id uuid references public.markets(id) on delete cascade not null,
  yes_pct integer not null check (yes_pct between 0 and 100),
  yes_pool integer not null default 0,
  no_pool integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_odds_history_market_time on public.market_odds_history(market_id, created_at);

alter table public.market_odds_history enable row level security;

create policy "odds_history_select" on public.market_odds_history
  for select using (auth.role() = 'authenticated');

create policy "odds_history_insert" on public.market_odds_history
  for insert with check (auth.role() = 'authenticated');

-- Seed initial 50/50 datapoint for all existing open markets
insert into public.market_odds_history (market_id, yes_pct, yes_pool, no_pool, created_at)
select id, 50, 0, 0, created_at
from public.markets;
