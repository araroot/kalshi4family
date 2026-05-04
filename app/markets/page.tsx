import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, TrendingUp, Search } from 'lucide-react'
import MarketCard from '@/components/MarketCard'
import WelcomeClient from './WelcomeClient'
import type { Market, Bet } from '@/types'

const CATEGORIES = ['All', 'Sports', 'Family', 'Politics', 'Entertainment', 'Finance', 'General']
const STATUSES = ['All', 'Open', 'Locked', 'Resolved']

interface PageProps {
  searchParams: Promise<{ category?: string; status?: string; q?: string }>
}

export default async function MarketsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Auto-lock expired markets
  await supabase.rpc('lock_expired_markets')

  let query = supabase
    .from('markets')
    .select('*, creator:profiles!creator_id(id,name,email)')
    .order('created_at', { ascending: false })

  if (params.category && params.category !== 'All') {
    query = query.eq('category', params.category)
  }
  if (params.status && params.status !== 'All') {
    query = query.eq('status', params.status.toLowerCase())
  }
  if (params.q) {
    query = query.ilike('title', `%${params.q}%`)
  }

  const [{ data: markets }, { data: profile }] = await Promise.all([
    query,
    supabase.from('profiles').select('id,name').eq('id', user.id).single(),
  ])

  // Fetch user's bets and comment counts
  const marketIds = markets?.map(m => m.id) ?? []
  const [{ data: userBets }, { data: commentCounts }] = await Promise.all([
    supabase.from('bets').select('*').eq('user_id', user.id).in('market_id', marketIds),
    supabase.from('comments').select('market_id').in('market_id', marketIds),
  ])

  const betsMap: Record<string, Bet> = {}
  userBets?.forEach(b => { betsMap[b.market_id] = b })

  const commentCountMap: Record<string, number> = {}
  commentCounts?.forEach(c => {
    commentCountMap[c.market_id] = (commentCountMap[c.market_id] ?? 0) + 1
  })

  const enrichedMarkets: Market[] = (markets ?? []).map(m => ({
    ...m,
    user_bet: betsMap[m.id] ?? null,
    comment_count: commentCountMap[m.id] ?? 0,
  }))

  const openCount = enrichedMarkets.filter(m => m.status === 'open').length

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Welcome confetti — fires once on first login after approval */}
      {profile && <WelcomeClient userId={profile.id} name={profile.name} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Markets</h1>
          <p className="text-sm text-[#555] mt-0.5">{openCount} open {openCount === 1 ? 'market' : 'markets'}</p>
        </div>
        <Link
          href="/markets/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#6366f1] hover:bg-[#5457e5] text-white text-sm font-semibold transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          New Market
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-6">
        {/* Search */}
        <form method="GET" className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
          <input
            name="q"
            defaultValue={params.q}
            placeholder="Search markets…"
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-[#111] border border-[#2a2a2a] text-white text-sm placeholder:text-[#555] focus:outline-none focus:border-[#6366f1] transition-colors"
          />
          {params.category && <input type="hidden" name="category" value={params.category} />}
          {params.status && <input type="hidden" name="status" value={params.status} />}
        </form>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <Link
              key={cat}
              href={`/markets?category=${cat}${params.status ? `&status=${params.status}` : ''}${params.q ? `&q=${params.q}` : ''}`}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                (params.category ?? 'All') === cat
                  ? 'bg-[#6366f1] text-white'
                  : 'bg-[#111] border border-[#2a2a2a] text-[#a1a1aa] hover:text-white hover:border-[#333]'
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>

        {/* Status pills */}
        <div className="flex gap-2">
          {STATUSES.map(s => (
            <Link
              key={s}
              href={`/markets?status=${s}${params.category ? `&category=${params.category}` : ''}${params.q ? `&q=${params.q}` : ''}`}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                (params.status ?? 'All') === s
                  ? 'bg-[#1a1a1a] border border-[#333] text-white'
                  : 'text-[#555] hover:text-[#a1a1aa]'
              }`}
            >
              {s}
            </Link>
          ))}
        </div>
      </div>

      {/* Markets grid */}
      {enrichedMarkets.length === 0 ? (
        <div className="text-center py-20">
          <TrendingUp className="w-12 h-12 text-[#2a2a2a] mx-auto mb-4" />
          <p className="text-[#555] text-sm">No markets yet.</p>
          <Link href="/markets/new" className="text-[#6366f1] text-sm hover:underline mt-2 inline-block">
            Create the first one →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {enrichedMarkets.map(market => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      )}
    </div>
  )
}
