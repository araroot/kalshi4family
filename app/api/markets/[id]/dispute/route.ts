import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: marketId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { reason } = await request.json()
  if (!reason?.trim()) return NextResponse.json({ error: 'Reason required' }, { status: 400 })

  const { data: market } = await supabase.from('markets').select('id,creator_id,status').eq('id', marketId).single()
  if (!market) return NextResponse.json({ error: 'Market not found' }, { status: 404 })
  if (market.creator_id === user.id) return NextResponse.json({ error: 'Creator cannot dispute own market' }, { status: 400 })

  const { data: existing } = await supabase.from('disputes').select('id').eq('market_id', marketId).eq('challenger_id', user.id).maybeSingle()
  if (existing) return NextResponse.json({ error: 'Already disputed' }, { status: 400 })

  const admin = createAdminClient()

  const { data, error } = await admin.from('disputes').insert({
    market_id: marketId,
    challenger_id: user.id,
    reason: reason.trim(),
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from('markets').update({ status: 'disputed', updated_at: new Date().toISOString() }).eq('id', marketId)
  await admin.from('notifications').insert({
    user_id: market.creator_id,
    title: '⚠️ Dispute filed',
    message: 'Someone has disputed the resolution of your market.',
    type: 'dispute',
  })

  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: marketId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { dispute_id, status, resolution_note } = await request.json()

  const { data: market } = await supabase.from('markets').select('id,creator_id').eq('id', marketId).single()
  if (!market) return NextResponse.json({ error: 'Market not found' }, { status: 404 })
  if (market.creator_id !== user.id) return NextResponse.json({ error: 'Only creator can resolve disputes' }, { status: 403 })

  const admin = createAdminClient()

  const { data, error } = await admin.from('disputes').update({
    status,
    resolution_note: resolution_note?.trim() ?? null,
    updated_at: new Date().toISOString(),
  }).eq('id', dispute_id).eq('market_id', marketId).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: pending } = await admin.from('disputes').select('id').eq('market_id', marketId).eq('status', 'pending')
  if (!pending?.length) {
    await admin.from('markets').update({ status: 'resolved', updated_at: new Date().toISOString() }).eq('id', marketId)
  }

  return NextResponse.json(data)
}
