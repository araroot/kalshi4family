'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { XOctagon, AlertTriangle, Coins, Users } from 'lucide-react'

interface Props {
  marketId: string
  creatorStake: number
  otherBetCount: number
  otherBetsTotal: number
}

export default function EarlyClosePanel({ marketId, creatorStake, otherBetCount, otherBetsTotal }: Props) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [closing, setClosing] = useState(false)
  const [error, setError] = useState('')

  const hasBettors = otherBetCount > 0

  async function closeMarket() {
    setClosing(true)
    setError('')
    try {
      const res = await fetch(`/api/markets/${marketId}/close`, { method: 'POST' })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Failed to close market')
        setClosing(false)
        return
      }
      router.push('/markets')
    } catch {
      setError('Something went wrong')
      setClosing(false)
    }
  }

  if (!confirming) {
    return (
      <div className="rounded-xl border border-[#2a2a2a] bg-[#111] p-4">
        <button
          onClick={() => setConfirming(true)}
          className="w-full flex items-center justify-center gap-2 h-9 rounded-lg border border-[#7f1d1d]/60 bg-[#450a0a]/40 text-[#f87171] text-sm font-semibold hover:bg-[#450a0a]/70 transition-colors"
        >
          <XOctagon className="w-4 h-4" />
          Close Market Early
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#7f1d1d]/50 bg-[#450a0a]/20 p-4 space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-[#f87171]">
        <AlertTriangle className="w-4 h-4" />
        Confirm Early Close
      </h3>

      <div className="space-y-2 text-xs">
        {hasBettors ? (
          <>
            <div className="flex items-start gap-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] p-2.5">
              <Users className="w-3.5 h-3.5 text-[#a1a1aa] mt-0.5 shrink-0" />
              <span className="text-[#a1a1aa]">
                <span className="text-white font-semibold">{otherBetCount} other {otherBetCount === 1 ? 'bettor' : 'bettors'}</span> ({otherBetsTotal.toLocaleString()} pts total) will have their bets <span className="text-[#22c55e] font-semibold">fully refunded</span>.
              </span>
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] p-2.5">
              <Coins className="w-3.5 h-3.5 text-[#f59e0b] mt-0.5 shrink-0" />
              <span className="text-[#a1a1aa]">
                Your <span className="text-[#f87171] font-bold">{creatorStake.toLocaleString()} pt stake will be distributed</span> to those bettors proportionally to their bet size.
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-start gap-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] p-2.5">
            <Coins className="w-3.5 h-3.5 text-[#f87171] mt-0.5 shrink-0" />
            <span className="text-[#a1a1aa]">
              No one else has bet yet. Your <span className="text-[#f87171] font-bold">{creatorStake.toLocaleString()} pt stake will be burned</span> — permanently lost.
            </span>
          </div>
        )}

        <p className="text-[#555] pl-0.5">
          Your own bets (if any) will be refunded. This cannot be undone.
        </p>
      </div>

      {error && <p className="text-xs text-[#f87171]">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          onClick={closeMarket}
          disabled={closing}
          className="flex-1 h-9 rounded-lg bg-[#7f1d1d] hover:bg-[#991b1b] text-[#fca5a5] text-sm font-bold transition-colors disabled:opacity-50"
        >
          {closing ? 'Closing…' : `Lose ${creatorStake} pts & Close`}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={closing}
          className="flex-1 h-9 rounded-lg bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#a1a1aa] text-sm font-semibold transition-colors disabled:opacity-50"
        >
          Keep Open
        </button>
      </div>
    </div>
  )
}
