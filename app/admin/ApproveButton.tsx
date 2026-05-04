'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserCheck } from 'lucide-react'

export default function ApproveButton({ userId }: { userId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function approve() {
    setLoading(true)
    const res = await fetch(`/api/users/${userId}/approve`, { method: 'POST' })
    if (res.ok) {
      setDone(true)
      router.refresh()
    }
    setLoading(false)
  }

  if (done) return <span className="text-xs text-[#22c55e] font-medium">Approved ✓</span>

  return (
    <button
      onClick={approve}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#052e16] border border-[#166534]/50 text-[#22c55e] text-xs font-semibold hover:bg-[#16a34a] hover:text-white transition-all disabled:opacity-50"
    >
      <UserCheck className="w-3.5 h-3.5" />
      {loading ? '…' : 'Approve'}
    </button>
  )
}
