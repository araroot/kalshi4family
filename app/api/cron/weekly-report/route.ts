import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { formatDistanceToNow, format } from 'date-fns'

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kalshi4family.vercel.app'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const soonThreshold = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
  const weekLabel = `Week ending ${format(new Date(), 'MMM d, yyyy')}`

  const [
    { data: lockedMarkets },
    { data: closingSoon },
    { data: resolvedThisWeek },
    { data: newBetsThisWeek },
    { data: newMarketsThisWeek },
    { data: approvedProfiles },
  ] = await Promise.all([
    admin.from('markets')
      .select('id, title, close_date, creator:profiles!creator_id(name)')
      .eq('status', 'locked')
      .order('close_date', { ascending: true }),

    admin.from('markets')
      .select('id, title, close_date, creator:profiles!creator_id(name)')
      .eq('status', 'open')
      .lte('close_date', soonThreshold)
      .order('close_date', { ascending: true }),

    admin.from('markets')
      .select('id, title, outcome, updated_at')
      .eq('status', 'resolved')
      .gte('updated_at', weekAgo),

    admin.from('bets')
      .select('id, amount, payout, market_id, user:profiles!user_id(name)')
      .gte('created_at', weekAgo),

    admin.from('markets')
      .select('id')
      .gte('created_at', weekAgo),

    admin.from('profiles')
      .select('id')
      .eq('is_approved', true),
  ])

  // Build a crisp summary for the push notification message
  const resolvedIds = new Set((resolvedThisWeek ?? []).map(m => m.id))
  const settledBets = (newBetsThisWeek ?? []).filter(b => resolvedIds.has(b.market_id) && b.payout !== null)

  const topWin = settledBets
    .filter(b => (b.payout ?? 0) > b.amount)
    .sort((a, b) => (b.payout! - b.amount) - (a.payout! - a.amount))[0]

  const topLoss = settledBets
    .filter(b => b.payout === 0)
    .sort((a, b) => b.amount - a.amount)[0]

  const overdueCount = (lockedMarkets ?? []).length
  const closingSoonCount = (closingSoon ?? []).length

  // Build notification lines
  const lines: string[] = [`📊 ${weekLabel}`]

  if (overdueCount > 0) {
    const first = lockedMarkets![0]
    const creatorName = (first.creator as unknown as { name: string } | null)?.name ?? 'Someone'
    const overdue = formatDistanceToNow(new Date(first.close_date))
    lines.push(`⏰ @${creatorName} — "${first.title}" needs resolution (${overdue} overdue)`)
    if (overdueCount > 1) lines.push(`  +${overdueCount - 1} more market${overdueCount - 1 > 1 ? 's' : ''} pending`)
  }

  if (closingSoonCount > 0) {
    const first = closingSoon![0]
    const timeLeft = formatDistanceToNow(new Date(first.close_date), { addSuffix: true })
    lines.push(`⚠️ "${first.title}" closes ${timeLeft} — get your bets in!`)
  }

  if (topWin) {
    const net = (topWin.payout ?? 0) - topWin.amount
    const name = (topWin.user as unknown as { name: string } | null)?.name ?? '?'
    lines.push(`🏆 ${name} won +${net.toLocaleString()} pts this week!`)
  }

  if (topLoss) {
    const name = (topLoss.user as unknown as { name: string } | null)?.name ?? '?'
    lines.push(`😬 ${name} lost ${topLoss.amount.toLocaleString()} pts`)
  }

  const resolvedCount = (resolvedThisWeek ?? []).length
  const betCount = (newBetsThisWeek ?? []).length
  const newMarketCount = (newMarketsThisWeek ?? []).length
  lines.push(`${resolvedCount} resolved · ${newMarketCount} new · ${betCount} bets this week`)
  lines.push(`👉 Full report: ${appUrl}/weekly-report`)

  const messageBody = lines.join('\n')

  // Notify every approved user
  const userIds = (approvedProfiles ?? []).map(p => p.id)
  if (userIds.length > 0) {
    await admin.from('notifications').insert(
      userIds.map(id => ({
        user_id: id,
        title: '📊 Weekly Report is ready!',
        message: messageBody,
        type: 'system' as const,
      }))
    )
  }

  return NextResponse.json({
    ok: true,
    users_notified: userIds.length,
    overdue: overdueCount,
    resolved_this_week: resolvedCount,
  })
}
