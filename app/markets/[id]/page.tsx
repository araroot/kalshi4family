import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { format, isPast, formatDistanceToNow } from 'date-fns'
import { ArrowLeft, Clock, Users, AlertCircle, CheckCircle2, XCircle, Flag, Coins } from 'lucide-react'
import Link from 'next/link'
import BetPanel from '@/components/BetPanel'
import CommentThread from '@/components/CommentThread'
import ShareButton from '@/components/ShareButton'
import OddsChart from '@/components/OddsChart'
import Image from 'next/image'
import ResolvePanel from './ResolvePanel'
import DisputePanel from './DisputePanel'
import MarkdownDescription from '@/components/MarkdownDescription'
import GenerateIconButton from './GenerateIconButton'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MarketDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: market },
    { data: profile },
  ] = await Promise.all([
    supabase.from('markets').select('*, creator:profiles!creator_id(*)').eq('id', id).single(),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
  ])

  if (!market) notFound()
  if (!profile) redirect('/login')

  const [
    { data: userBets },
    { data: allBets },
    { data: comments },
    { data: disputes },
    { data: oddsHistory },
  ] = await Promise.all([
    supabase.from('bets').select('*').eq('market_id', id).eq('user_id', user.id).order('created_at', { ascending: true }),
    supabase.from('bets').select('*, user:profiles!user_id(id,name,email)').eq('market_id', id),
    supabase.from('comments').select('*, user:profiles!user_id(id,name,email)').eq('market_id', id).order('created_at', { ascending: true }),
    supabase.from('disputes').select('*, challenger:profiles!challenger_id(id,name,email)').eq('market_id', id).order('created_at', { ascending: false }),
    supabase.from('market_odds_history').select('yes_pct,yes_pool,no_pool,created_at').eq('market_id', id).order('created_at', { ascending: true }),
  ])

  const isCreator = market.creator_id === user.id
  const total = market.yes_pool + market.no_pool
  const yesPct = total > 0 ? Math.round((market.yes_pool / total) * 100) : 50
  const hasDispute = disputes?.some(d => d.status === 'pending')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kalshi4family.vercel.app'
  const shareText = `🎯 *${market.title}*\n\nYES: ${yesPct}% | NO: ${100 - yesPct}%\nPool: ${total.toLocaleString()} pts\n\nBet now → ${appUrl}/markets/${market.id}`

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Link href="/markets" className="flex items-center gap-1.5 text-sm text-[#a1a1aa] hover:text-white transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        All markets
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Market info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header card */}
          <div className="rounded-xl border border-[#2a2a2a] bg-[#111] p-5">
            <div className="flex items-start gap-4">
              {/* Icon: creator gets interactive regenerate button, others get static image */}
              {isCreator ? (
                <GenerateIconButton
                  marketId={market.id}
                  title={market.title}
                  description={market.description}
                  imageUrl={market.image_url ?? null}
                />
              ) : market.image_url ? (
                <Image
                  src={market.image_url}
                  alt=""
                  width={80}
                  height={80}
                  className="rounded-xl object-cover shrink-0"
                />
              ) : null}

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-xs font-medium text-[#555] bg-[#1a1a1a] px-2 py-0.5 rounded-full">{market.category}</span>
                  <StatusBadge status={market.status} outcome={market.outcome} />
                  {hasDispute && (
                    <span className="flex items-center gap-1 text-xs font-medium text-[#f87171] bg-[#450a0a]/60 border border-[#7f1d1d]/40 px-2 py-0.5 rounded-full">
                      <AlertCircle className="w-3 h-3" /> Disputed
                    </span>
                  )}
                </div>
                <h1 className="text-xl font-bold text-white leading-snug mb-2">{market.title}</h1>
              </div>
            </div>

            {market.description && (
              <MarkdownDescription content={market.description} />
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#555]">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                Created by <span className="text-[#a1a1aa] ml-1">{market.creator?.name}</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {isPast(new Date(market.close_date))
                  ? `Closed ${formatDistanceToNow(new Date(market.close_date), { addSuffix: true })}`
                  : `Closes ${format(new Date(market.close_date), 'MMM d, yyyy h:mm a')}`}
              </span>
              <span className="flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-[#f59e0b]" />
                {total.toLocaleString()} pts in pool
              </span>
            </div>

            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#1a1a1a]">
              <ShareButton text={shareText} size="sm" />
            </div>
          </div>

          {/* Odds chart */}
          <div className="rounded-xl border border-[#2a2a2a] bg-[#111] p-5">
            <OddsChart history={oddsHistory ?? []} status={market.status} />
          </div>

          {/* Bettors list */}
          {allBets && allBets.length > 0 && (
            <div className="rounded-xl border border-[#2a2a2a] bg-[#111] p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Bets ({allBets.length})</h3>
              <div className="space-y-2">
                {allBets.map(bet => (
                  <div key={bet.id} className="flex items-center justify-between py-1.5 border-b border-[#1a1a1a] last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#2a2a2a] flex items-center justify-center text-xs font-bold text-[#a1a1aa]">
                        {(bet.user?.name ?? '?').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-white">{bet.user?.name ?? 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#555]">{bet.amount.toLocaleString()} pts</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${bet.position ? 'text-[#22c55e] bg-[#052e16]/80' : 'text-[#ef4444] bg-[#450a0a]/80'}`}>
                        {bet.position ? 'YES' : 'NO'}
                      </span>
                      {bet.payout !== null && bet.payout !== undefined && (
                        <span className={`text-xs font-semibold ${bet.payout >= bet.amount ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                          → {bet.payout.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dispute section */}
          {disputes && disputes.length > 0 && (
            <div className="rounded-xl border border-[#7f1d1d]/50 bg-[#450a0a]/20 p-5">
              <h3 className="text-sm font-semibold text-[#f87171] mb-3 flex items-center gap-2">
                <Flag className="w-4 h-4" /> Disputes
              </h3>
              <div className="space-y-3">
                {disputes.map(dispute => (
                  <div key={dispute.id} className="rounded-lg bg-[#1a1a1a] p-3 border border-[#2a2a2a]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-white font-medium">{dispute.challenger?.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        dispute.status === 'pending' ? 'text-[#f59e0b] bg-[#451a03]/60' :
                        dispute.status === 'resolved' ? 'text-[#22c55e] bg-[#052e16]/60' :
                        'text-[#555] bg-[#1a1a1a]'
                      }`}>{dispute.status}</span>
                    </div>
                    <p className="text-xs text-[#a1a1aa]">{dispute.reason}</p>
                    {dispute.resolution_note && (
                      <p className="text-xs text-[#555] mt-1 italic">Response: {dispute.resolution_note}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Discussion */}
          <div className="rounded-xl border border-[#2a2a2a] bg-[#111] p-5">
            <CommentThread
              marketId={market.id}
              comments={comments ?? []}
              currentUser={profile}
            />
          </div>
        </div>

        {/* Right: Bet panel + actions */}
        <div className="space-y-4">
          <BetPanel
            market={market}
            profile={profile}
            existingBets={userBets ?? []}
          />

          {/* Resolve panel — creator only, when market is locked */}
          {isCreator && (market.status === 'locked' || market.status === 'open') && (
            <ResolvePanel marketId={market.id} currentOutcome={market.outcome} />
          )}

          {/* Dispute panel — non-creator, after close */}
          {!isCreator && (market.status === 'locked' || market.status === 'resolved') && (userBets ?? []).some(b => !b.payout) && (
            <DisputePanel
              marketId={market.id}
              alreadyDisputed={disputes?.some(d => d.challenger_id === user.id) ?? false}
            />
          )}

          {/* Share */}
          <ShareButton text={shareText} className="w-full justify-center" />
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status, outcome }: { status: string; outcome: boolean | null | undefined }) {
  if (status === 'resolved' && outcome !== null && outcome !== undefined) {
    return (
      <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${outcome ? 'text-[#22c55e] bg-[#052e16]/80 border border-[#166534]/40' : 'text-[#ef4444] bg-[#450a0a]/80 border border-[#7f1d1d]/40'}`}>
        {outcome ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        Resolved {outcome ? 'YES' : 'NO'}
      </span>
    )
  }
  const map: Record<string, string> = {
    open: 'text-[#22c55e] bg-[#052e16]/80 border-[#166534]/40',
    locked: 'text-[#f59e0b] bg-[#451a03]/80 border-[#92400e]/40',
    disputed: 'text-[#f87171] bg-[#450a0a]/80 border-[#7f1d1d]/40',
    cancelled: 'text-[#555] bg-[#111] border-[#222]',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${map[status] ?? map.open}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
