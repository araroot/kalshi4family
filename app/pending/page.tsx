import { Clock, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function PendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'radial-gradient(ellipse at center, #111 0%, #0a0a0a 100%)' }}>
      <div className="w-full max-w-sm animate-fade-in text-center">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-[#6366f1] flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Kalshi4Family</span>
        </div>

        <div className="rounded-2xl border border-[#2a2a2a] bg-[#111] p-8">
          <div className="w-14 h-14 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/20 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-7 h-7 text-[#f59e0b]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Pending Approval</h1>
          <p className="text-[#a1a1aa] text-sm leading-relaxed mb-6">
            Your account has been created! The family admin will approve you shortly. You&apos;ll start with{' '}
            <span className="text-white font-semibold">1,000 points</span> and get{' '}
            <span className="text-white font-semibold">200 fresh points every Saturday</span> (use them or lose them).
          </p>
          <div className="rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] p-3 text-xs text-[#a1a1aa]">
            Have questions? Ask the admin directly — they&apos;ll approve your account via email notification.
          </div>
        </div>

        <Link href="/login" className="block mt-4 text-sm text-[#555] hover:text-[#a1a1aa] transition-colors">
          ← Back to sign in
        </Link>
      </div>
    </div>
  )
}
