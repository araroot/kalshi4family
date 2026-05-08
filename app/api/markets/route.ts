import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const MIN_STAKE = 100

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('markets')
    .select('*, creator:profiles!creator_id(id,name)')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('permanent_points, weekly_points, is_approved')
    .eq('id', user.id)
    .single()

  if (!profile?.is_approved) return NextResponse.json({ error: 'Account not approved' }, { status: 403 })

  const body = await request.json()
  const { title, description, category, close_date, image_url, icon_generation_count } = body

  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })
  if (!close_date || new Date(close_date) <= new Date()) return NextResponse.json({ error: 'Close date must be in future' }, { status: 400 })

  // Check creator has enough for the stake
  const totalPoints = (profile.permanent_points ?? 0) + (profile.weekly_points ?? 0)
  if (totalPoints < MIN_STAKE) {
    return NextResponse.json(
      { error: `You need at least ${MIN_STAKE} pts to create a market (you have ${totalPoints})` },
      { status: 402 }
    )
  }

  // Deduct stake (weekly first, then permanent)
  const weeklyUsed = Math.min(MIN_STAKE, profile.weekly_points)
  const permanentUsed = MIN_STAKE - weeklyUsed
  const { error: deductError } = await supabase
    .from('profiles')
    .update({
      weekly_points: profile.weekly_points - weeklyUsed,
      permanent_points: profile.permanent_points - permanentUsed,
    })
    .eq('id', user.id)

  if (deductError) return NextResponse.json({ error: 'Failed to deduct stake' }, { status: 500 })

  const { data, error } = await supabase
    .from('markets')
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      category: category ?? 'General',
      close_date,
      creator_id: user.id,
      creator_stake: MIN_STAKE,
      image_url: image_url ?? null,
      icon_generation_count: icon_generation_count ?? 0,
    })
    .select()
    .single()

  if (error) {
    // Refund stake if market creation failed
    await supabase.from('profiles').update({
      weekly_points: profile.weekly_points,
      permanent_points: profile.permanent_points,
    }).eq('id', user.id)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Seed opening 50/50 odds datapoint
  const admin = createAdminClient()
  await admin.from('market_odds_history').insert({
    market_id: data.id,
    yes_pct: 50,
    yes_pool: 0,
    no_pool: 0,
    created_at: data.created_at,
  })

  return NextResponse.json(data, { status: 201 })
}
