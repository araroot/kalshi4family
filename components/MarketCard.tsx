import Link from 'next/link'
import { formatDistanceToNow, isPast } from 'date-fns'
import { Users, MessageSquare, Coins, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import type { Market } from '@/types'

interface MarketCardProps {
  market: Market
}

export default function MarketCard({ market }: MarketCardProps) {
  const total = market.yes_pool + market.no_pool
  const yesPct = total > 0 ? Math.round((market.yes_pool / total) * 100) : 50
  const noPct = 100 - yesPct
  const isLocked = market.status === 'locked' || market.status === 'resolved' || isPast(new Date(market.close_date))
  const betCount = total > 0 ? '—' : '0'

  const statusBadge = {
    open: { label: 'Open', color: 'text-[#22c55e] bg-[#052e16]/80 border-[#166534]/40' },
    locked: { label: 'Locked', color: 'text-[#f59e0b] bg-[#451a03]/80 border-[#92400e]/40' },
    resolved: { label: 'Resolved', color: 'text-[#a1a1aa] bg-[#1a1a1a] border-[#333]' },
    disputed: { label: 'Disputed', color: 'text-[#f87171] bg-[#450a0a]/80 border-[#7f1d1d]/40' },
    cancelled: { label: 'Cancelled', color: 'text-[#555] bg-[#111] border-[#222]' },
  }

  const badge = statusBadge[market.status] ?? statusBadge.open

  return (
    <Link href={`/markets/${market.id}`} className="block group">
      <div className="rounded-xl border border-[#2a2a2a] bg-[#111] p-4 hover:border-[#333] hover:bg-[#141414] transition-all duration-200 group-hover:shadow-lg group-hover:shadow-black/30">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-medium text-[#555] bg-[#1a1a1a] px-2 py-0.5 rounded-full">
                {market.category}
              </span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${badge.color}`}>
                {badge.label}
              </span>
              {market.outcome !== null && market.outcome !== undefined && (
                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${market.outcome ? 'text-[#22c55e] bg-[#052e16]/80' : 'text-[#ef4444] bg-[#450a0a]/80'}`}>
                  {market.outcome ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {market.outcome ? 'YES' : 'NO'}
                </span>
              )}
            </div>
            <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2 group-hover:text-[#e5e5e5] transition-colors">
              {market.title}
            </h3>
          </div>
        </div>

        {/* Odds bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs font-semibold mb-1.5">
            <span className="text-[#22c55e]">YES {yesPct}%</span>
            <span className="text-[#ef4444]">NO {noPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#16a34a] to-[#22c55e] transition-all duration-500"
              style={{ width: `${yesPct}%` }}
            />
          </div>
        </div>

        {/* Footer stats */}
        <div className="flex items-center justify-between text-xs text-[#555]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Coins className="w-3 h-3" />
              {total.toLocaleString()} pts
            </span>
            {market.comment_count !== undefined && (
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {market.comment_count}
              </span>
            )}
          </div>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {isLocked && market.status !== 'resolved'
              ? 'Locked'
              : isPast(new Date(market.close_date))
              ? 'Ended'
              : formatDistanceToNow(new Date(market.close_date), { addSuffix: true })}
          </span>
        </div>

        {/* User's bet indicator */}
        {market.user_bet && (
          <div className={`mt-3 pt-3 border-t border-[#1a1a1a] flex items-center gap-1.5 text-xs font-medium ${market.user_bet.position ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
            <CheckCircle2 className="w-3 h-3" />
            You bet {market.user_bet.position ? 'YES' : 'NO'} — {market.user_bet.amount.toLocaleString()} pts
            {market.user_bet.payout !== null && market.user_bet.payout !== undefined && (
              <span className="ml-1 text-[#a1a1aa]">→ {market.user_bet.payout.toLocaleString()} pts payout</span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
