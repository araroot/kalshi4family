import Link from 'next/link'
import { formatDistanceToNow, isPast } from 'date-fns'
import { MessageSquare, Coins, Clock, CheckCircle2, XCircle } from 'lucide-react'
import type { Market } from '@/types'
import OddsSparkline from './OddsSparkline'

interface MarketCardProps {
  market: Market
}

const STATUS = {
  open:     'text-[#22c55e] bg-[#052e16]/80 border-[#166534]/40',
  locked:   'text-[#f59e0b] bg-[#451a03]/80 border-[#92400e]/40',
  resolved: 'text-[#a1a1aa] bg-[#1a1a1a] border-[#333]',
  disputed: 'text-[#f87171] bg-[#450a0a]/80 border-[#7f1d1d]/40',
  cancelled:'text-[#555] bg-[#111] border-[#222]',
}

export default function MarketCard({ market }: MarketCardProps) {
  const total = market.yes_pool + market.no_pool
  const yesPct = total > 0 ? Math.round((market.yes_pool / total) * 100) : 50
  const noPct = 100 - yesPct
  const history = market.odds_history ?? [50]
  const past = isPast(new Date(market.close_date))
  const badge = STATUS[market.status] ?? STATUS.open

  const yesColor = yesPct >= 50 ? '#22c55e' : '#ef4444'

  return (
    <Link href={`/markets/${market.id}`} className="block group">
      <div className="rounded-xl border border-[#2a2a2a] bg-[#111] hover:border-[#333] hover:bg-[#141414] transition-all duration-200 overflow-hidden group-hover:shadow-lg group-hover:shadow-black/30">

        {/* Chart area */}
        <div className="relative px-4 pt-4 pb-2">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs font-medium text-[#555] bg-[#1a1a1a] px-2 py-0.5 rounded-full">{market.category}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${badge}`}>
                {market.status.charAt(0).toUpperCase() + market.status.slice(1)}
              </span>
            </div>
            {/* Sparkline */}
            <OddsSparkline history={history} width={100} height={32} />
          </div>

          <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2 group-hover:text-[#e5e5e5] transition-colors mb-3">
            {market.title}
          </h3>

          {/* Big odds display — Kalshi style */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1">
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span style={{ color: '#22c55e' }}>YES</span>
                <span style={{ color: '#ef4444' }}>NO</span>
              </div>
              <div className="h-2 rounded-full bg-[#1a1a1a] overflow-hidden flex">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${yesPct}%`, background: 'linear-gradient(90deg, #16a34a, #22c55e)' }}
                />
                <div className="h-full flex-1" style={{ background: 'linear-gradient(270deg, #dc2626, #ef4444)' }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-lg font-bold tabular-nums" style={{ color: '#22c55e' }}>{yesPct}¢</span>
                <span className="text-lg font-bold tabular-nums" style={{ color: '#ef4444' }}>{noPct}¢</span>
              </div>
            </div>
          </div>

          {/* Resolved outcome */}
          {market.outcome !== null && market.outcome !== undefined && (
            <div className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-lg mb-2 w-fit ${market.outcome ? 'text-[#22c55e] bg-[#052e16]/80' : 'text-[#ef4444] bg-[#450a0a]/80'}`}>
              {market.outcome ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              Resolved {market.outcome ? 'YES' : 'NO'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#1a1a1a] text-xs text-[#555]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Coins className="w-3 h-3 text-[#f59e0b]" />
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
            {past ? 'Ended' : formatDistanceToNow(new Date(market.close_date), { addSuffix: true })}
          </span>
        </div>

        {/* User bet strip */}
        {market.user_bet && (
          <div className={`px-4 py-2 text-xs font-medium flex items-center gap-1.5 border-t ${market.user_bet.position ? 'border-[#166534]/30 bg-[#052e16]/40 text-[#22c55e]' : 'border-[#7f1d1d]/30 bg-[#450a0a]/40 text-[#ef4444]'}`}>
            <CheckCircle2 className="w-3 h-3" />
            You bet {market.user_bet.position ? 'YES' : 'NO'} — {market.user_bet.amount.toLocaleString()} pts
            {market.user_bet.payout != null && (
              <span className="ml-1 text-[#a1a1aa]">→ {market.user_bet.payout.toLocaleString()} payout</span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
