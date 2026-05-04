import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: targetUserId } = await params

  // Verify the caller is an admin using the normal (RLS-respecting) client
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: adminProfile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!adminProfile?.is_admin) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  // Use service-role client to update another user's profile (bypasses RLS)
  const admin = createAdminClient()

  const { data, error } = await admin.from('profiles').update({
    is_approved: true,
    updated_at: new Date().toISOString(),
  }).eq('id', targetUserId).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from('notifications').insert({
    user_id: targetUserId,
    title: "🎉 You're in! 1,000 points incoming!",
    message: "Welcome to Kalshi4Family! You start with 1,000 points. Every Saturday you get a fresh 200 more — use them before next Saturday or they vanish. Let's go!",
    type: 'system',
  })

  return NextResponse.json(data)
}
