import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Trophy, Coins, TrendingUp, Target } from 'lucide-react'
import ShareButton from '@/components/ShareButton'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id,name,email,permanent_points,weekly_points,is_approved')
    .eq('is_approved', true)
    .order('permanent_points', { ascending: false })

  const { data: allBets } = await supabase
    .from('bets')
    .select('user_id,amount,payout,position')

  // Build stats per user
  const stats: Record<string, { total_bets: number; won_bets: number; total_wagered: number; total_won: number }> = {}
  allBets?.forEach(bet => {
    if (!stats[bet.user_id]) stats[bet.user_id] = { total_bets: 0, won_bets: 0, total_wagered: 0, total_won: 0 }
    stats[bet.user_id].total_bets++
    stats[bet.user_id].total_wagered += bet.amount
    if (bet.payout !== null && bet.payout > 0) {
      stats[bet.user_id].won_bets++
      stats[bet.user_id].total_won += bet.payout
    }
  })

  const leaderboard = (profiles ?? []).map(p => ({
    ...p,
    ...(stats[p.id] ?? { total_bets: 0, won_bets: 0, total_wagered: 0, total_won: 0 }),
    total_points: p.permanent_points + p.weekly_points,
  })).sort((a, b) => b.permanent_points - a.permanent_points)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kalshi4family.vercel.app'
  const top3 = leaderboard.slice(0, 3).map((p, i) => `${['🥇','🥈','🥉'][i]} ${p.name}: ${p.permanent_points.toLocaleString()} pts`).join('\n')
  const shareText = `🏆 *Kalshi4Family Leaderboard*\n\n${top3}\n\nJoin the fun → ${appUrl}/leaderboard`

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#f59e0b]" />
          <h1 className="text-xl font-bold text-white">Leaderboard</h1>
        </div>
        <ShareButton text={shareText} size="sm" />
      </div>

      {/* Podium for top 3 */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[leaderboard[1], leaderboard[0], leaderboard[2]].map((p, i) => {
            const rank = i === 1 ? 1 : i === 0 ? 2 : 3
            const heights = ['h-24', 'h-32', 'h-20']
            const colors = ['border-[#94a3b8]/40 bg-[#94a3b8]/5', 'border-[#f59e0b]/40 bg-[#f59e0b]/5', 'border-[#b45309]/30 bg-[#b45309]/5']
            const medals = ['🥈', '🥇', '🥉']
            return (
              <div key={p.id} className={`flex flex-col items-center justify-end rounded-xl border ${colors[i]} p-3 ${heights[i]} transition-all`}>
                <div className="text-2xl mb-1">{medals[i]}</div>
                <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center text-sm font-bold text-white mb-1">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <p className="text-xs font-semibold text-white truncate max-w-full">{p.name.split(' ')[0]}</p>
                <p className="text-xs text-[#a1a1aa] font-mono">{p.permanent_points.toLocaleString()}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Full table */}
      <div className="rounded-xl border border-[#2a2a2a] bg-[#111] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2a2a2a]">
              <th className="text-left px-4 py-3 text-xs font-medium text-[#555]">#</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#555]">Player</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[#555]">
                <span className="flex items-center gap-1 justify-end"><Coins className="w-3 h-3 text-[#f59e0b]" />Points</span>
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[#555] hidden sm:table-cell">
                <span className="flex items-center gap-1 justify-end"><Target className="w-3 h-3" />Bets</span>
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[#555] hidden sm:table-cell">
                <span className="flex items-center gap-1 justify-end"><TrendingUp className="w-3 h-3" />Win%</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((p, i) => {
              const winRate = p.total_bets > 0 ? Math.round((p.won_bets / p.total_bets) * 100) : 0
              const isCurrentUser = p.id === user.id
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null
              return (
                <tr
                  key={p.id}
                  className={`border-b border-[#1a1a1a] last:border-0 transition-colors ${isCurrentUser ? 'bg-[#6366f1]/5' : 'hover:bg-[#141414]'}`}
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold text-[#555]">{medal ?? `#${i + 1}`}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isCurrentUser ? 'bg-[#6366f1] text-white' : 'bg-[#2a2a2a] text-[#a1a1aa]'}`}>
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {p.name}
                          {isCurrentUser && <span className="text-xs text-[#6366f1] ml-1">(you)</span>}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div>
                      <span className="text-sm font-semibold text-white tabular-nums">{p.permanent_points.toLocaleString()}</span>
                      {p.weekly_points > 0 && (
                        <span className="block text-xs text-[#6366f1]">+{p.weekly_points}w</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    <span className="text-sm text-[#a1a1aa]">{p.total_bets}</span>
                  </td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    <span className={`text-sm font-medium ${winRate >= 60 ? 'text-[#22c55e]' : winRate >= 40 ? 'text-[#a1a1aa]' : 'text-[#ef4444]'}`}>
                      {p.total_bets > 0 ? `${winRate}%` : '—'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {leaderboard.length === 0 && (
          <div className="text-center py-12 text-[#555] text-sm">No players yet.</div>
        )}
      </div>
    </div>
  )
}
