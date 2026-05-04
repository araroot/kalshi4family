import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: marketId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { outcome } = await request.json()
  if (typeof outcome !== 'boolean') return NextResponse.json({ error: 'outcome must be boolean' }, { status: 400 })

  const { data: market } = await supabase
    .from('markets')
    .select('id,creator_id,status,yes_pool,no_pool,title')
    .eq('id', marketId)
    .single()

  if (!market) return NextResponse.json({ error: 'Market not found' }, { status: 404 })
  if (market.creator_id !== user.id) return NextResponse.json({ error: 'Only the creator can resolve' }, { status: 403 })
  if (market.status === 'resolved') return NextResponse.json({ error: 'Already resolved' }, { status: 400 })

  const { data: bets } = await supabase.from('bets').select('*').eq('market_id', marketId)
  if (!bets) return NextResponse.json({ error: 'Failed to load bets' }, { status: 500 })

  const totalPool = market.yes_pool + market.no_pool
  const winningPool = outcome ? market.yes_pool : market.no_pool
  const winners = bets.filter(b => b.position === outcome)
  const losers = bets.filter(b => b.position !== outcome)

  // Calculate payouts for winners
  const payouts: Record<string, number> = {}
  winners.forEach(bet => {
    payouts[bet.id] = winningPool > 0 ? Math.round((bet.amount / winningPool) * totalPool) : bet.amount
  })

  // Mark market resolved
  await supabase.from('markets').update({
    status: 'resolved',
    outcome,
    updated_at: new Date().toISOString(),
  }).eq('id', marketId)

  // Update bet payouts and award points to winners
  for (const bet of winners) {
    const payout = payouts[bet.id]
    const { data: prof } = await supabase.from('profiles').select('permanent_points').eq('id', bet.user_id).single()
    if (!prof) continue
    await Promise.all([
      supabase.from('bets').update({ payout }).eq('id', bet.id),
      supabase.from('profiles').update({
        permanent_points: prof.permanent_points + payout,
        updated_at: new Date().toISOString(),
      }).eq('id', bet.user_id),
    ])
  }

  // Mark losing bets with payout = 0
  for (const bet of losers) {
    await supabase.from('bets').update({ payout: 0 }).eq('id', bet.id)
  }

  // Notify all bettors
  const notifications = bets.map(bet => {
    const won = bet.position === outcome
    const payout = payouts[bet.id] ?? 0
    return {
      user_id: bet.user_id,
      title: won ? '🎉 You won!' : '😔 Market resolved',
      message: won
        ? `You won ${payout.toLocaleString()} pts! Market: "${market.title}"`
        : `You lost ${bet.amount.toLocaleString()} pts. Market: "${market.title}" resolved ${outcome ? 'YES' : 'NO'}`,
      type: won ? 'win' as const : 'loss' as const,
    }
  })
  if (notifications.length) await supabase.from('notifications').insert(notifications)

  return NextResponse.json({ ok: true, winners: winners.length, losers: losers.length, total_pool: totalPool })
}
