export interface Profile {
  id: string
  email: string
  name: string
  avatar_url: string | null
  permanent_points: number
  weekly_points: number
  is_approved: boolean
  is_admin: boolean
  created_at: string
  updated_at: string
}

export type MarketStatus = 'open' | 'locked' | 'resolved' | 'disputed' | 'cancelled'

export interface Market {
  id: string
  title: string
  description: string | null
  creator_id: string
  close_date: string
  status: MarketStatus
  outcome: boolean | null
  yes_pool: number
  no_pool: number
  category: string
  created_at: string
  updated_at: string
  image_url?: string | null
  creator?: Profile
  user_bets?: Bet[]
  comment_count?: number
  odds_history?: number[]
}

export interface Bet {
  id: string
  market_id: string
  user_id: string
  position: boolean
  amount: number
  weekly_points_used: number
  permanent_points_used: number
  payout: number | null
  created_at: string
  user?: Profile
}

export interface Comment {
  id: string
  market_id: string
  user_id: string
  content: string
  parent_id: string | null
  attachment_url: string | null
  created_at: string
  user?: Profile
  replies?: Comment[]
}

export interface Dispute {
  id: string
  market_id: string
  challenger_id: string
  reason: string
  status: 'pending' | 'resolved' | 'dismissed'
  resolution_note: string | null
  created_at: string
  updated_at: string
  challenger?: Profile
  market?: Market
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'win' | 'loss' | 'dispute' | 'system'
  read: boolean
  created_at: string
}

export interface LeaderboardEntry {
  id: string
  name: string
  email: string
  avatar_url: string | null
  permanent_points: number
  weekly_points: number
  total_bets: number
  won_bets: number
  total_wagered: number
  total_won: number
}
