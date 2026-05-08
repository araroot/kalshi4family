import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: marketId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: market } = await supabase
    .from('markets')
    .select('id, creator_id, creator_stake, status, title')
    .eq('id', marketId)
    .single()

  if (!market) return NextResponse.json({ error: 'Market not found' }, { status: 404 })
  if (market.creator_id !== user.id) return NextResponse.json({ error: 'Only the creator can close this market' }, { status: 403 })
  if (market.status !== 'open') return NextResponse.json({ error: 'Only open markets can be closed early' }, { status: 400 })

  const admin = createAdminClient()

  const { data: allBets } = await admin.from('bets').select('*').eq('market_id', marketId)
  const bets = allBets ?? []

  const creatorBets = bets.filter(b => b.user_id === user.id)
  const otherBets = bets.filter(b => b.user_id !== user.id)
  const otherBetsTotal = otherBets.reduce((s, b) => s + b.amount, 0)
  const stake = market.creator_stake ?? 0

  // Cancel the market
  await admin.from('markets').update({
    status: 'cancelled',
    updated_at: new Date().toISOString(),
  }).eq('id', marketId)

  // Refund creator's own bets — aggregate to avoid double-counting profile updates
  const creatorRefund = creatorBets.reduce((s, b) => s + b.amount, 0)
  for (const bet of creatorBets) {
    await admin.from('bets').update({ payout: bet.amount }).eq('id', bet.id)
  }
  if (creatorRefund > 0) {
    const { data: creatorProf } = await admin.from('profiles').select('permanent_points').eq('id', user.id).single()
    if (creatorProf) {
      await admin.from('profiles').update({
        permanent_points: creatorProf.permanent_points + creatorRefund,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id)
    }
  }

  if (otherBets.length === 0 || otherBetsTotal === 0) {
    // No other bettors — stake is burned
    await admin.from('notifications').insert({
      user_id: user.id,
      title: 'Market closed early — stake burned',
      message: `You closed "${market.title}" early with no other bettors. Your ${stake} pt stake has been burned.`,
      type: 'loss',
    })
  } else {
    // Distribute stake proportionally to other bettors; also refund their bets
    // Aggregate payout per user across multiple bets
    const userPayouts: Record<string, number> = {}

    for (const bet of otherBets) {
      const stakePortion = otherBetsTotal > 0
        ? Math.round((bet.amount / otherBetsTotal) * stake)
        : 0
      const payout = bet.amount + stakePortion
      await admin.from('bets').update({ payout }).eq('id', bet.id)
      userPayouts[bet.user_id] = (userPayouts[bet.user_id] ?? 0) + payout
    }

    // Credit each other bettor
    for (const [userId, totalPayout] of Object.entries(userPayouts)) {
      const { data: prof } = await admin.from('profiles').select('permanent_points').eq('id', userId).single()
      if (!prof) continue
      await admin.from('profiles').update({
        permanent_points: prof.permanent_points + totalPayout,
        updated_at: new Date().toISOString(),
      }).eq('id', userId)
    }

    // Notifications for other bettors (one per user)
    const userBetTotals: Record<string, number> = {}
    for (const bet of otherBets) {
      userBetTotals[bet.user_id] = (userBetTotals[bet.user_id] ?? 0) + bet.amount
    }
    const betterNotifications = Object.entries(userPayouts).map(([userId, totalPayout]) => {
      const originalBet = userBetTotals[userId] ?? 0
      const bonus = totalPayout - originalBet
      return {
        user_id: userId,
        title: 'Market closed early — refunded + bonus',
        message: `"${market.title}" was closed early. You got ${originalBet} pts back${bonus > 0 ? ` + ${bonus} pts from the creator's stake` : ''}.`,
        type: 'win' as const,
      }
    })
    if (betterNotifications.length) await admin.from('notifications').insert(betterNotifications)

    // Notify creator
    const uniqueBettors = Object.keys(userPayouts).length
    await admin.from('notifications').insert({
      user_id: user.id,
      title: 'Market closed early — stake distributed',
      message: `You closed "${market.title}" early. Your ${stake} pt stake was distributed to ${uniqueBettors} bettor${uniqueBettors !== 1 ? 's' : ''}.`,
      type: 'loss',
    })
  }

  return NextResponse.json({ ok: true })
}
