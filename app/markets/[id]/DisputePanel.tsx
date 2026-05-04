'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Flag } from 'lucide-react'

interface DisputePanelProps {
  marketId: string
  alreadyDisputed: boolean
}

export default function DisputePanel({ marketId, alreadyDisputed }: DisputePanelProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(alreadyDisputed)

  async function fileDispute() {
    if (!reason.trim()) return
    setLoading(true)
    const res = await fetch(`/api/markets/${marketId}/dispute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason.trim() }),
    })
    if (res.ok) {
      setDone(true)
      setOpen(false)
      router.refresh()
    }
    setLoading(false)
  }

  if (done) {
    return (
      <div className="rounded-xl border border-[#7f1d1d]/40 bg-[#450a0a]/20 p-4 text-xs text-[#f87171] flex items-center gap-2">
        <Flag className="w-4 h-4" /> Dispute filed. The creator has been notified.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#111] p-4">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-sm text-[#555] hover:text-[#f87171] transition-colors"
        >
          <Flag className="w-4 h-4" /> Dispute this resolution
        </button>
      ) : (
        <div>
          <p className="text-sm font-semibold text-[#f87171] mb-2 flex items-center gap-2">
            <Flag className="w-4 h-4" /> File a Dispute
          </p>
          <p className="text-xs text-[#a1a1aa] mb-3">Explain why you think the resolution is incorrect. The creator will respond.</p>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Reason for dispute…"
            rows={3}
            autoFocus
            className="w-full rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-white px-3 py-2 text-sm placeholder:text-[#555] focus:outline-none focus:border-[#ef4444] transition-colors resize-none mb-3"
          />
          <div className="flex gap-2">
            <button
              onClick={fileDispute}
              disabled={loading || !reason.trim()}
              className="flex-1 h-8 rounded-lg bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'Filing…' : 'File Dispute'}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="px-3 h-8 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-[#a1a1aa] text-xs hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
