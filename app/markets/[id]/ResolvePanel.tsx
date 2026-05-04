'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Gavel } from 'lucide-react'

interface ResolvePanelProps {
  marketId: string
  currentOutcome: boolean | null | undefined
}

export default function ResolvePanel({ marketId, currentOutcome }: ResolvePanelProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')

  async function resolve(outcome: boolean) {
    if (!confirm(`Resolve this market as ${outcome ? 'YES' : 'NO'}? This distributes points to winners.`)) return
    setError('')
    setLoading(true)
    const res = await fetch(`/api/markets/${marketId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome, resolution_note: note }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to resolve')
      setLoading(false)
    } else {
      router.refresh()
    }
  }

  return (
    <div className="rounded-xl border border-[#6366f1]/30 bg-[#1e1b4b]/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Gavel className="w-4 h-4 text-[#818cf8]" />
        <p className="text-sm font-semibold text-[#818cf8]">Resolve Market</p>
      </div>
      <p className="text-xs text-[#a1a1aa] mb-3">As the creator, you decide the outcome. Points are distributed immediately.</p>

      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Add a resolution note (optional)…"
        rows={2}
        className="w-full rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-white px-3 py-2 text-sm placeholder:text-[#555] focus:outline-none focus:border-[#6366f1] transition-colors resize-none mb-3"
      />

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => resolve(true)}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 h-9 rounded-lg bg-[#052e16] border border-[#166534]/50 text-[#22c55e] text-sm font-bold hover:bg-[#16a34a] hover:text-white transition-all disabled:opacity-50"
        >
          <CheckCircle2 className="w-4 h-4" /> YES
        </button>
        <button
          onClick={() => resolve(false)}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 h-9 rounded-lg bg-[#450a0a] border border-[#7f1d1d]/50 text-[#ef4444] text-sm font-bold hover:bg-[#dc2626] hover:text-white transition-all disabled:opacity-50"
        >
          <XCircle className="w-4 h-4" /> NO
        </button>
      </div>

      {error && <p className="text-xs text-[#fca5a5] mt-2">{error}</p>}
    </div>
  )
}
