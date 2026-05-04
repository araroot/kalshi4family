# Kalshi4Family

A private prediction markets app for family fun. Bet points on anything, discuss in threads, see who's the sharpest forecaster on the leaderboard.

**Stack:** Next.js 16 · TypeScript · Supabase · Tailwind CSS · Vercel

---

## Setup (one-time)

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Name it `kalshi4family`, choose a region close to you
3. Copy your **Project URL** and **anon public key** from Settings → API

### 2. Run the database schema

In your Supabase project → SQL Editor → paste and run the contents of `supabase/schema.sql`

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key   # Settings → API → service_role
CRON_SECRET=make_up_a_random_string_here
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app   # update after deploying
```

### 4. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The first user to sign up automatically becomes admin.

---

## Deploy to Vercel

1. Push this repo to GitHub (already done if you're reading this there)
2. Go to [vercel.com/new](https://vercel.com/new) → Import your GitHub repo
3. Add all environment variables from `.env.local` in the Vercel dashboard
4. Deploy — Vercel auto-detects Next.js

The weekly allowance cron job runs every Monday at midnight UTC (configured in `vercel.json`). Add `CRON_SECRET` to your Vercel environment variables to secure it.

---

## How it works

| Feature | Details |
|---|---|
| **Points** | Start with 1,000 permanent points + 100 weekly (use or lose) |
| **Betting** | Pool-style: winners split the losing side's pot proportionally |
| **Markets** | Anyone creates a yes/no question with a close date |
| **Settlement** | Creator resolves the market after it closes |
| **Disputes** | Anyone can file a dispute; creator is final arbiter |
| **Discussion** | Threaded comments on every market |
| **WhatsApp share** | One-tap share button on markets and leaderboard |
| **Admin** | First signup = mega admin; can approve new members |

---

## Adding WhatsApp notifications (future)

The share buttons use WhatsApp's click-to-chat URL and require no setup. For push notifications (new market, resolution alerts), you'd need a [Meta Business Account](https://developers.facebook.com/docs/whatsapp/cloud-api) — parked for later.

---

## Project structure

```
app/
  login/         Sign-in page
  signup/        Registration page  
  pending/       Awaiting approval
  markets/       Markets list + detail + new market form
  leaderboard/   Rankings
  admin/         User approvals + dispute management
  notifications/ In-app notifications
  api/           All API routes
components/
  Nav.tsx        Top navigation with points display
  MarketCard.tsx Market card for list view
  BetPanel.tsx   YES/NO betting interface
  CommentThread.tsx  Threaded discussion
  ShareButton.tsx    WhatsApp share
supabase/
  schema.sql     Full DB schema — run once in Supabase
```
