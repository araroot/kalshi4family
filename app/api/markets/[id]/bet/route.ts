import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: marketId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { position, amount } = await request.json()
  if (typeof position !== 'boolean') return NextResponse.json({ error: 'position must be boolean' }, { status: 400 })
  if (!Number.isInteger(amount) || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })

  const [{ data: market }, { data: profile }] = await Promise.all([
    supabase.from('markets').select('id,status,yes_pool,no_pool,close_date').eq('id', marketId).single(),
    supabase.from('profiles').select('permanent_points,weekly_points,is_approved').eq('id', user.id).single(),
  ])

  if (!market) return NextResponse.json({ error: 'Market not found' }, { status: 404 })
  if (market.status !== 'open') return NextResponse.json({ error: 'Market is not open for betting' }, { status: 400 })
  if (new Date(market.close_date) <= new Date()) return NextResponse.json({ error: 'Market has closed' }, { status: 400 })
  if (!profile?.is_approved) return NextResponse.json({ error: 'Account not approved' }, { status: 403 })

  const totalPoints = profile.permanent_points + profile.weekly_points
  if (amount > totalPoints) return NextResponse.json({ error: 'Insufficient points' }, { status: 400 })

  const weeklyUsed = Math.min(amount, profile.weekly_points)
  const permanentUsed = amount - weeklyUsed

  const admin = createAdminClient()

  const betResult = await admin.from('bets').insert({
    market_id: marketId,
    user_id: user.id,
    position,
    amount,
    weekly_points_used: weeklyUsed,
    permanent_points_used: permanentUsed,
  }).select().single()

  if (betResult.error) return NextResponse.json({ error: betResult.error.message }, { status: 500 })

  const newYesPool = position ? market.yes_pool + amount : market.yes_pool
  const newNoPool = !position ? market.no_pool + amount : market.no_pool
  const newTotal = newYesPool + newNoPool
  const newYesPct = newTotal > 0 ? Math.round((newYesPool / newTotal) * 100) : 50

  // Deduct points, update market pool, record odds snapshot
  await Promise.all([
    admin.from('profiles').update({
      weekly_points: profile.weekly_points - weeklyUsed,
      permanent_points: profile.permanent_points - permanentUsed,
    }).eq('id', user.id),
    admin.from('markets').update({
      yes_pool: newYesPool,
      no_pool: newNoPool,
    }).eq('id', marketId),
    admin.from('market_odds_history').insert({
      market_id: marketId,
      yes_pct: newYesPct,
      yes_pool: newYesPool,
      no_pool: newNoPool,
    }),
  ])

  return NextResponse.json({ bet: betResult.data }, { status: 201 })
}
