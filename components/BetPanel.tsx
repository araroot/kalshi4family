'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Coins, Lock, TrendingUp } from 'lucide-react'
import type { Market, Profile, Bet } from '@/types'

interface BetPanelProps {
  market: Market
  profile: Profile
  existingBets: Bet[]
}

export default function BetPanel({ market, profile, existingBets }: BetPanelProps) {
  const router = useRouter()
  const [position, setPosition] = useState<boolean>(true)
  const [amount, setAmount] = useState(50)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const totalPoints = profile.permanent_points + profile.weekly_points
  const total = market.yes_pool + market.no_pool
  const yesPct = total > 0 ? Math.round((market.yes_pool / total) * 100) : 50
  const noPct = 100 - yesPct

  // Multiplier: how many times your stake comes back if you win (based on current pool)
  const yesMultiplier = market.yes_pool > 0
    ? ((total + amount) / (market.yes_pool + (position ? amount : 0))).toFixed(2)
    : '∞'
  const noMultiplier = market.no_pool > 0
    ? ((total + amount) / (market.no_pool + (!position ? amount : 0))).toFixed(2)
    : '∞'
  const currentMultiplier = position ? yesMultiplier : noMultiplier

  const potAfterBet = total + amount
  const myPool = position ? market.yes_pool + amount : market.no_pool + amount
  const estimatedPayout = myPool > 0 ? Math.round((amount / myPool) * potAfterBet) : amount
  const estimatedProfit = estimatedPayout - amount

  const locked = market.status !== 'open'

  async function placeBet() {
    setError('')
    setSuccess('')
    if (amount <= 0) { setError('Amount must be positive'); return }
    if (amount > totalPoints) { setError('Insufficient points'); return }

    setLoading(true)
    const res = await fetch(`/api/markets/${market.id}/bet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position, amount }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to place bet')
    } else {
      setSuccess(`Bet placed! ${amount} pts on ${position ? 'YES' : 'NO'}`)
      router.refresh()
    }
    setLoading(false)
  }

  if (locked) {
    return (
      <div className="rounded-xl border border-[#2a2a2a] bg-[#111] p-5">
        <div className="flex items-center gap-2 text-[#a1a1aa] mb-4">
          <Lock className="w-4 h-4" />
          <span className="text-sm font-medium">Betting {market.status === 'resolved' ? 'closed' : 'locked'}</span>
        </div>
        <OddsDisplay yesPct={yesPct} noPct={noPct} yesPool={market.yes_pool} noPool={market.no_pool} />
        {existingBets.length > 0 && <BetsList bets={existingBets} outcome={market.outcome} className="mt-4" />}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#111] p-5">
      {/* Existing bets summary */}
      {existingBets.length > 0 && (
        <div className="mb-4">
          <BetsList bets={existingBets} outcome={market.outcome} />
          <div className="my-4 border-t border-[#1a1a1a]" />
          <p className="text-xs text-[#a1a1aa] font-medium mb-3">Add another bet</p>
        </div>
      )}

      {!existingBets.length && <p className="text-sm text-white font-semibold mb-4">Place your bet</p>}

      {/* YES/NO toggle with multipliers */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => setPosition(true)}
          className={`rounded-lg font-bold text-sm transition-all py-2.5 px-3 ${
            position
              ? 'bg-[#16a34a] text-white border-2 border-[#22c55e]/50 shadow-lg shadow-[#16a34a]/20'
              : 'bg-[#052e16]/60 text-[#22c55e] border border-[#166534]/40 hover:bg-[#052e16]'
          }`}
        >
          <div>YES {yesPct}%</div>
          <div className={`text-xs mt-0.5 font-normal ${position ? 'text-[#86efac]' : 'text-[#16a34a]'}`}>
            {market.yes_pool > 0 ? `${yesMultiplier}x return` : 'First bet!'}
          </div>
        </button>
        <button
          onClick={() => setPosition(false)}
          className={`rounded-lg font-bold text-sm transition-all py-2.5 px-3 ${
            !position
              ? 'bg-[#dc2626] text-white border-2 border-[#ef4444]/50 shadow-lg shadow-[#dc2626]/20'
              : 'bg-[#450a0a]/60 text-[#ef4444] border border-[#7f1d1d]/40 hover:bg-[#450a0a]'
          }`}
        >
          <div>NO {noPct}%</div>
          <div className={`text-xs mt-0.5 font-normal ${!position ? 'text-[#fca5a5]' : 'text-[#dc2626]'}`}>
            {market.no_pool > 0 ? `${noMultiplier}x return` : 'First bet!'}
          </div>
        </button>
      </div>

      {/* Amount */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-[#a1a1aa] font-medium">Amount</label>
          <div className="flex items-center gap-1 text-xs text-[#a1a1aa]">
            <Coins className="w-3 h-3 text-[#f59e0b]" />
            <span>{totalPoints.toLocaleString()} available</span>
            {profile.weekly_points > 0 && (
              <span className="text-[#6366f1]">({profile.weekly_points}w)</span>
            )}
          </div>
        </div>

        <div className="flex gap-2 mb-2">
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(Math.max(1, Math.min(totalPoints, parseInt(e.target.value) || 0)))}
            min={1}
            max={totalPoints}
            className="flex-1 h-10 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-white px-3 text-sm focus:outline-none focus:border-[#6366f1] transition-colors"
          />
          <button onClick={() => setAmount(Math.floor(totalPoints / 4))} className="px-3 h-10 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-xs text-[#a1a1aa] hover:text-white transition-colors">¼</button>
          <button onClick={() => setAmount(Math.floor(totalPoints / 2))} className="px-3 h-10 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-xs text-[#a1a1aa] hover:text-white transition-colors">½</button>
          <button onClick={() => setAmount(totalPoints)} className="px-3 h-10 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-xs text-[#a1a1aa] hover:text-white transition-colors">Max</button>
        </div>

        <input
          type="range"
          min={1}
          max={Math.max(1, totalPoints)}
          value={amount}
          onChange={e => setAmount(parseInt(e.target.value))}
          className="w-full accent-[#6366f1]"
        />
      </div>

      {/* Payout preview */}
      <div className={`rounded-lg border p-3 mb-4 ${position ? 'bg-[#052e16]/40 border-[#166534]/30' : 'bg-[#450a0a]/40 border-[#7f1d1d]/30'}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[#555]">Bet {amount} pts on {position ? 'YES' : 'NO'}</span>
          <span className="text-sm font-bold text-white flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-[#6366f1]" />
            {currentMultiplier}x
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[#555]">Win payout</span>
          <span className="font-semibold text-white">{estimatedPayout.toLocaleString()} pts</span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-[#555]">Profit if win</span>
          <span className={`font-semibold ${estimatedProfit >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
            {estimatedProfit >= 0 ? '+' : ''}{estimatedProfit.toLocaleString()} pts
          </span>
        </div>
      </div>

      {error && <div className="rounded-lg bg-[#450a0a] border border-[#7f1d1d] px-3 py-2 text-sm text-[#fca5a5] mb-3">{error}</div>}
      {success && <div className="rounded-lg bg-[#052e16] border border-[#166534] px-3 py-2 text-sm text-[#86efac] mb-3">{success}</div>}

      <button
        onClick={placeBet}
        disabled={loading || amount <= 0 || amount > totalPoints}
        className={`w-full h-11 rounded-lg text-white text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          position
            ? 'bg-[#16a34a] hover:bg-[#15803d]'
            : 'bg-[#dc2626] hover:bg-[#b91c1c]'
        }`}
      >
        {loading ? 'Placing bet…' : `Bet ${amount} pts on ${position ? 'YES' : 'NO'} → win ${estimatedPayout.toLocaleString()}`}
      </button>

      <OddsDisplay yesPct={yesPct} noPct={noPct} yesPool={market.yes_pool} noPool={market.no_pool} className="mt-4" />
    </div>
  )
}

function BetsList({ bets, outcome, className = '' }: { bets: Bet[]; outcome: boolean | null | undefined; className?: string }) {
  const totalWagered = bets.reduce((s, b) => s + b.amount, 0)
  const totalPayout = bets.reduce((s, b) => s + (b.payout ?? 0), 0)
  const resolved = bets.some(b => b.payout !== null)

  return (
    <div className={className}>
      <p className="text-xs text-[#a1a1aa] font-medium mb-2">Your positions ({bets.length})</p>
      <div className="space-y-1.5">
        {bets.map(bet => {
          const won = outcome !== null && outcome !== undefined && bet.position === outcome
          const lost = outcome !== null && outcome !== undefined && bet.position !== outcome
          return (
            <div key={bet.id} className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs border ${
              won ? 'bg-[#052e16]/60 border-[#166534]/40' :
              lost ? 'bg-[#450a0a]/60 border-[#7f1d1d]/40' :
              'bg-[#1a1a1a] border-[#2a2a2a]'
            }`}>
              <span className={`font-bold ${bet.position ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                {bet.position ? 'YES' : 'NO'} — {bet.amount.toLocaleString()} pts
              </span>
              {won && <span className="text-[#22c55e] font-bold">+{((bet.payout ?? 0) - bet.amount).toLocaleString()} 🎉</span>}
              {lost && <span className="text-[#ef4444]">Lost</span>}
              {!won && !lost && <span className="text-[#555]">Pending</span>}
            </div>
          )
        })}
      </div>
      {resolved && (
        <div className="mt-2 flex justify-between text-xs text-[#555]">
          <span>Total wagered: {totalWagered.toLocaleString()} pts</span>
          <span>Total payout: <span className={totalPayout >= totalWagered ? 'text-[#22c55e]' : 'text-[#ef4444]'}>{totalPayout.toLocaleString()} pts</span></span>
        </div>
      )}
    </div>
  )
}

function OddsDisplay({ yesPct, noPct, yesPool, noPool, className = '' }: { yesPct: number; noPct: number; yesPool: number; noPool: number; className?: string }) {
  const total = yesPool + noPool
  return (
    <div className={className}>
      <div className="flex justify-between text-xs font-medium mb-1.5">
        <span className="text-[#22c55e]">YES {yesPct}%</span>
        <span className="text-[#555] text-xs">{total.toLocaleString()} pts total</span>
        <span className="text-[#ef4444]">NO {noPct}%</span>
      </div>
      <div className="h-2 rounded-full bg-[#1a1a1a] overflow-hidden flex">
        <div className="h-full bg-gradient-to-r from-[#16a34a] to-[#22c55e] transition-all duration-500" style={{ width: `${yesPct}%` }} />
        <div className="h-full bg-gradient-to-l from-[#dc2626] to-[#ef4444] flex-1 transition-all duration-500" />
      </div>
      <div className="flex justify-between text-xs text-[#555] mt-1">
        <span>{yesPool.toLocaleString()} pts</span>
        <span>{noPool.toLocaleString()} pts</span>
      </div>
    </div>
  )
}
