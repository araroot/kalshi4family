import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { market_id, content, parent_id } = await request.json()
  if (!market_id) return NextResponse.json({ error: 'market_id required' }, { status: 400 })
  if (!content?.trim()) return NextResponse.json({ error: 'content required' }, { status: 400 })

  const { data, error } = await supabase.from('comments').insert({
    market_id,
    user_id: user.id,
    content: content.trim(),
    parent_id: parent_id ?? null,
  }).select('*, user:profiles!user_id(id,name,email)').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
