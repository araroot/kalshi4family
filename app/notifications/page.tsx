import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Bell, Check } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Notification } from '@/types'
import MarkAllReadButton from './MarkAllReadButton'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const typeColors: Record<string, string> = {
    win: 'text-[#22c55e] bg-[#052e16]/60',
    loss: 'text-[#ef4444] bg-[#450a0a]/60',
    dispute: 'text-[#f59e0b] bg-[#451a03]/60',
    system: 'text-[#818cf8] bg-[#1e1b4b]/60',
    info: 'text-[#a1a1aa] bg-[#1a1a1a]',
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#a1a1aa]" />
          <h1 className="text-xl font-bold text-white">Notifications</h1>
        </div>
        {notifications && notifications.some(n => !n.read) && (
          <MarkAllReadButton userId={user.id} />
        )}
      </div>

      {!notifications?.length ? (
        <div className="text-center py-16 text-[#555]">
          <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n: Notification) => (
            <div
              key={n.id}
              className={`rounded-xl border p-4 transition-colors ${
                n.read ? 'border-[#1a1a1a] bg-[#0f0f0f]' : 'border-[#2a2a2a] bg-[#111]'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-0.5 ${typeColors[n.type]}`}>
                  {n.type}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${n.read ? 'text-[#a1a1aa]' : 'text-white'}`}>{n.title}</p>
                  <p className="text-xs text-[#555] mt-0.5">{n.message}</p>
                  <p className="text-xs text-[#444] mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-[#6366f1] shrink-0 mt-1.5" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
