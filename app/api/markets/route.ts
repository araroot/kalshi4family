import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

  const { data: profile } = await supabase.from('profiles').select('is_approved').eq('id', user.id).single()
  if (!profile?.is_approved) return NextResponse.json({ error: 'Account not approved' }, { status: 403 })

  const body = await request.json()
  const { title, description, category, close_date } = body

  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })
  if (!close_date || new Date(close_date) <= new Date()) return NextResponse.json({ error: 'Close date must be in future' }, { status: 400 })

  const { data, error } = await supabase
    .from('markets')
    .insert({ title: title.trim(), description: description?.trim() || null, category: category ?? 'General', close_date, creator_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
