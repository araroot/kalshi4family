'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BarChart2, Trophy, Shield, LogOut, Menu, X, Bell, Coins, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

interface NavProps {
  profile: Profile
  unreadCount?: number
}

export default function Nav({ profile, unreadCount = 0 }: NavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const links = [
    { href: '/markets', label: 'Markets', icon: TrendingUp },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    ...(profile.is_admin ? [{ href: '/admin', label: 'Admin', icon: Shield }] : []),
  ]

  const totalPoints = profile.permanent_points + profile.weekly_points

  return (
    <nav className="sticky top-0 z-50 border-b border-[#2a2a2a] bg-[#0a0a0a]/95 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/markets" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-md bg-[#6366f1] flex items-center justify-center">
            <BarChart2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-sm hidden sm:block tracking-tight">Kalshi4Family</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(href)
                  ? 'bg-[#1a1a1a] text-white'
                  : 'text-[#a1a1aa] hover:text-white hover:bg-[#161616]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Points badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
            <Coins className="w-3.5 h-3.5 text-[#f59e0b]" />
            <span className="text-sm font-semibold text-white tabular-nums">
              {totalPoints.toLocaleString()}
            </span>
            {profile.weekly_points > 0 && (
              <span className="text-xs text-[#6366f1] font-medium">+{profile.weekly_points}w</span>
            )}
          </div>

          {/* Notifications */}
          <Link href="/notifications" className="relative w-8 h-8 flex items-center justify-center rounded-lg text-[#a1a1aa] hover:text-white hover:bg-[#1a1a1a] transition-colors">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#6366f1] rounded-full" />
            )}
          </Link>

          {/* User initials */}
          <div className="w-8 h-8 rounded-full bg-[#6366f1] flex items-center justify-center text-xs font-bold text-white select-none">
            {profile.name.charAt(0).toUpperCase()}
          </div>

          {/* Sign out */}
          <button
            onClick={signOut}
            className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg text-[#a1a1aa] hover:text-white hover:bg-[#1a1a1a] transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Mobile menu */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-[#a1a1aa] hover:text-white hover:bg-[#1a1a1a] transition-colors"
          >
            {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3 space-y-1 animate-fade-in">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(href)
                  ? 'bg-[#1a1a1a] text-white'
                  : 'text-[#a1a1aa] hover:text-white hover:bg-[#161616]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#a1a1aa] hover:text-white hover:bg-[#161616] transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}
    </nav>
  )
}
