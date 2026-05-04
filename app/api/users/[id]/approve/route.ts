import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: targetUserId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: adminProfile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!adminProfile?.is_admin) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { data, error } = await supabase.from('profiles').update({
    is_approved: true,
    updated_at: new Date().toISOString(),
  }).eq('id', targetUserId).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify the approved user
  await supabase.from('notifications').insert({
    user_id: targetUserId,
    title: '✅ Account approved!',
    message: 'Welcome to Kalshi4Family! You have 1,000 points to start. Good luck!',
    type: 'system',
  })

  return NextResponse.json(data)
}
