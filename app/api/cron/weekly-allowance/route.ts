import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('distribute_weekly_allowance')

  if (error) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ weekly_points: 200, updated_at: new Date().toISOString() })
      .eq('is_approved', true)
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_approved', true)

  if (profiles?.length) {
    await supabase.from('notifications').insert(
      profiles.map(p => ({
        user_id: p.id,
        title: '🎉 Saturday 200 points!',
        message: "Your 200 weekly points just dropped! Use them before next Saturday or they're gone.",
        type: 'system' as const,
      }))
    )
  }

  return NextResponse.json({ ok: true, users: profiles?.length ?? 0 })
}
