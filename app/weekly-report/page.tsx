import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDistanceToNow, format } from 'date-fns'
import { AlertCircle, Clock, Trophy, TrendingDown, BarChart2, Flame } from 'lucide-react'
import WeeklyReportShare from './WeeklyReportShare'

export const dynamic = 'force-dynamic'

export default async function WeeklyReportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const soonThreshold = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kalshi4family.vercel.app'

  const [
    { data: lockedMarkets },
    { data: closingSoon },
    { data: resolvedThisWeek },
    { data: newBetsThisWeek },
    { data: newMarketsThisWeek },
  ] = await Promise.all([
    supabase.from('markets')
      .select('id, title, close_date, creator:profiles!creator_id(name)')
      .eq('status', 'locked')
      .order('close_date', { ascending: true }),

    supabase.from('markets')
      .select('id, title, close_date, creator:profiles!creator_id(name)')
      .eq('status', 'open')
      .lte('close_date', soonThreshold)
      .order('close_date', { ascending: true }),

    supabase.from('markets')
      .select('id, title, outcome, yes_pool, no_pool, updated_at')
      .eq('status', 'resolved')
      .gte('updated_at', weekAgo),

    supabase.from('bets')
      .select('id, amount, position, payout, market_id, user:profiles!user_id(name)')
      .gte('created_at', weekAgo),

    supabase.from('markets')
      .select('id')
      .gte('created_at', weekAgo),
  ])

  // Wins: bets on markets resolved this week where payout > amount
  const resolvedIds = new Set((resolvedThisWeek ?? []).map(m => m.id))
  const settledBets = (newBetsThisWeek ?? []).filter(b => resolvedIds.has(b.market_id) && b.payout !== null)

  type BetWithUser = typeof settledBets[number]

  const wins: BetWithUser[] = settledBets
    .filter(b => (b.payout ?? 0) > b.amount)
    .sort((a, b) => (b.payout! - b.amount) - (a.payout! - a.amount))
    .slice(0, 3)

  const losses: BetWithUser[] = settledBets
    .filter(b => b.payout === 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)

  // Most active market this week by bet count
  const betsByMarket: Record<string, number> = {}
  ;(newBetsThisWeek ?? []).forEach(b => {
    betsByMarket[b.market_id] = (betsByMarket[b.market_id] ?? 0) + 1
  })
  const hottestMarketId = Object.entries(betsByMarket).sort((a, b) => b[1] - a[1])[0]?.[0]
  const hottestMarket = resolvedThisWeek?.find(m => m.id === hottestMarketId)
    ?? (hottestMarketId ? { id: hottestMarketId } : null)

  const totalWageredThisWeek = (newBetsThisWeek ?? []).reduce((s, b) => s + b.amount, 0)
  const weekLabel = `Week ending ${format(new Date(), 'MMM d, yyyy')}`

  const medals = ['🥇', '🥈', '🥉']

  // ── Build plain-text version for WhatsApp ──────────────────────────────────
  const lines: string[] = [
    `🎯 *Kalshi4Family — Weekly Report*`,
    `📅 ${weekLabel}`,
    '',
  ]

  const todoLines: string[] = []
  ;(lockedMarkets ?? []).slice(0, 3).forEach(m => {
    const creator = (m.creator as { name: string } | null)?.name ?? 'Someone'
    const overdue = formatDistanceToNow(new Date(m.close_date), { addSuffix: false })
    todoLines.push(`⏰ @${creator} — "${m.title}" locked ${overdue} ago, needs resolution!`)
  })
  ;(closingSoon ?? []).slice(0, 2).forEach(m => {
    const creator = (m.creator as { name: string } | null)?.name ?? 'Someone'
    const timeLeft = formatDistanceToNow(new Date(m.close_date), { addSuffix: true })
    todoLines.push(`⚠️ @${creator} — "${m.title}" closes ${timeLeft}!`)
  })

  if (todoLines.length) {
    lines.push(`📋 *ACTION NEEDED*`)
    lines.push(...todoLines)
    lines.push('')
  }

  if (wins.length) {
    lines.push(`🏆 *BIG WINS*`)
    wins.forEach((b, i) => {
      const net = (b.payout ?? 0) - b.amount
      const name = (b.user as { name: string } | null)?.name ?? '?'
      lines.push(`${medals[i]} ${name} +${net.toLocaleString()} pts ✅`)
    })
    lines.push('')
  }

  if (losses.length) {
    lines.push(`💸 *TOUGH LOSSES*`)
    losses.forEach(b => {
      const name = (b.user as { name: string } | null)?.name ?? '?'
      lines.push(`😬 ${name} lost ${b.amount.toLocaleString()} pts ❌`)
    })
    lines.push('')
  }

  const statsLine = [
    `${(resolvedThisWeek ?? []).length} resolved`,
    `${(newMarketsThisWeek ?? []).length} new markets`,
    `${(newBetsThisWeek ?? []).length} bets placed`,
    `${totalWageredThisWeek.toLocaleString()} pts wagered`,
  ].join(' · ')
  lines.push(`📊 *THIS WEEK*`)
  lines.push(statsLine)
  lines.push('')
  lines.push(`🎲 Bet now → ${appUrl}`)

  const reportText = lines.join('\n')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            📊 Weekly Report
          </h1>
          <p className="text-sm text-[#555] mt-0.5">{weekLabel}</p>
        </div>
        <WeeklyReportShare text={reportText} />
      </div>

      <div className="space-y-4">

        {/* ACTION NEEDED */}
        {((lockedMarkets ?? []).length > 0 || (closingSoon ?? []).length > 0) && (
          <section className="rounded-xl border border-[#f59e0b]/30 bg-[#1a1200]/60 p-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-[#f59e0b] mb-3">
              <AlertCircle className="w-4 h-4" /> ACTION NEEDED
            </h2>
            <div className="space-y-2">
              {(lockedMarkets ?? []).slice(0, 3).map(m => {
                const creator = (m.creator as { name: string } | null)?.name ?? 'Someone'
                const overdue = formatDistanceToNow(new Date(m.close_date), { addSuffix: false })
                return (
                  <div key={m.id} className="flex items-start gap-2 text-sm">
                    <span className="text-lg leading-none">⏰</span>
                    <span className="text-[#a1a1aa]">
                      <span className="text-white font-semibold">@{creator}</span>
                      {' '}— &ldquo;{m.title}&rdquo;{' '}
                      <span className="text-[#ef4444] font-medium">locked {overdue} ago</span>, please resolve!
                    </span>
                  </div>
                )
              })}
              {(closingSoon ?? []).slice(0, 2).map(m => {
                const creator = (m.creator as { name: string } | null)?.name ?? 'Someone'
                const timeLeft = formatDistanceToNow(new Date(m.close_date), { addSuffix: true })
                return (
                  <div key={m.id} className="flex items-start gap-2 text-sm">
                    <span className="text-lg leading-none">⚠️</span>
                    <span className="text-[#a1a1aa]">
                      <span className="text-white font-semibold">@{creator}</span>
                      {' '}— &ldquo;{m.title}&rdquo; closes{' '}
                      <span className="text-[#f59e0b] font-medium">{timeLeft}</span>!
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* BIG WINS */}
        {wins.length > 0 && (
          <section className="rounded-xl border border-[#166534]/40 bg-[#052e16]/40 p-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-[#22c55e] mb-3">
              <Trophy className="w-4 h-4" /> BIG WINS THIS WEEK
            </h2>
            <div className="space-y-2">
              {wins.map((b, i) => {
                const net = (b.payout ?? 0) - b.amount
                const name = (b.user as { name: string } | null)?.name ?? '?'
                return (
                  <div key={b.id} className="flex items-center justify-between">
                    <span className="text-sm text-[#a1a1aa]">
                      <span className="mr-1.5">{medals[i]}</span>
                      <span className="text-white font-semibold">{name}</span>
                    </span>
                    <span className="text-sm font-bold text-[#22c55e]">+{net.toLocaleString()} pts ✅</span>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* TOUGH LOSSES */}
        {losses.length > 0 && (
          <section className="rounded-xl border border-[#7f1d1d]/40 bg-[#450a0a]/30 p-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-[#f87171] mb-3">
              <TrendingDown className="w-4 h-4" /> TOUGH LOSSES THIS WEEK
            </h2>
            <div className="space-y-2">
              {losses.map(b => {
                const name = (b.user as { name: string } | null)?.name ?? '?'
                return (
                  <div key={b.id} className="flex items-center justify-between">
                    <span className="text-sm text-[#a1a1aa]">
                      <span className="mr-1.5">😬</span>
                      <span className="text-white font-semibold">{name}</span>
                    </span>
                    <span className="text-sm font-bold text-[#ef4444]">−{b.amount.toLocaleString()} pts ❌</span>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* STATS */}
        <section className="rounded-xl border border-[#2a2a2a] bg-[#111] p-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[#a1a1aa] mb-3">
            <BarChart2 className="w-4 h-4" /> THIS WEEK BY THE NUMBERS
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Markets resolved', value: (resolvedThisWeek ?? []).length },
              { label: 'New markets', value: (newMarketsThisWeek ?? []).length },
              { label: 'Bets placed', value: (newBetsThisWeek ?? []).length },
              { label: 'Pts wagered', value: totalWageredThisWeek.toLocaleString() },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] p-3">
                <div className="text-xl font-black text-white tabular-nums">{value}</div>
                <div className="text-xs text-[#555] mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {hottestMarket && betsByMarket[hottestMarket.id] >= 2 && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] p-2.5">
              <Flame className="w-4 h-4 text-[#f59e0b] shrink-0" />
              <span className="text-xs text-[#a1a1aa]">
                Most active:{' '}
                <span className="text-white font-semibold">
                  {betsByMarket[hottestMarket.id]} bets
                </span>{' '}
                this week
              </span>
            </div>
          )}
        </section>

        {/* Empty state */}
        {(resolvedThisWeek ?? []).length === 0 &&
         (newBetsThisWeek ?? []).length === 0 &&
         (lockedMarkets ?? []).length === 0 && (
          <div className="rounded-xl border border-[#2a2a2a] bg-[#111] p-8 text-center">
            <p className="text-4xl mb-2">😴</p>
            <p className="text-white font-semibold">Quiet week!</p>
            <p className="text-sm text-[#555] mt-1">No activity to report yet. Go place some bets!</p>
          </div>
        )}
      </div>
    </div>
  )
}
