'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function MarkAllReadButton({ userId }: { userId: string }) {
  const router = useRouter()
  const supabase = createClient()

  async function markAll() {
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId)
    router.refresh()
  }

  return (
    <button onClick={markAll} className="text-xs text-[#6366f1] hover:text-[#818cf8] transition-colors">
      Mark all read
    </button>
  )
}
