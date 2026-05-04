'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DisputeActions({ disputeId, marketId }: { disputeId: string; marketId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [note, setNote] = useState('')

  async function resolve(status: 'resolved' | 'dismissed') {
    setLoading(true)
    await fetch(`/api/markets/${marketId}/dispute`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dispute_id: disputeId, status, resolution_note: note }),
    })
    setDone(true)
    router.refresh()
    setLoading(false)
  }

  if (done) return <span className="text-xs text-[#555]">Resolved</span>

  return (
    <div className="flex flex-col gap-2 min-w-[140px]">
      <input
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Response note…"
        className="h-7 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-white px-2 text-xs focus:outline-none focus:border-[#6366f1]"
      />
      <div className="flex gap-1.5">
        <button onClick={() => resolve('resolved')} disabled={loading} className="flex-1 h-7 rounded-lg bg-[#052e16] border border-[#166534]/40 text-[#22c55e] text-xs font-medium hover:bg-[#16a34a] hover:text-white transition-all disabled:opacity-50">
          Uphold
        </button>
        <button onClick={() => resolve('dismissed')} disabled={loading} className="flex-1 h-7 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-[#555] text-xs font-medium hover:text-white transition-colors disabled:opacity-50">
          Dismiss
        </button>
      </div>
    </div>
  )
}
