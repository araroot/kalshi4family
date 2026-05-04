'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, Eye, EyeOff } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/pending')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'radial-gradient(ellipse at center, #111 0%, #0a0a0a 100%)' }}>
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-[#6366f1] flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Kalshi4Family</span>
        </div>

        <div className="rounded-2xl border border-[#2a2a2a] bg-[#111] p-8">
          <h1 className="text-2xl font-bold text-white mb-1">Join the family</h1>
          <p className="text-sm text-[#a1a1aa] mb-6">Create your prediction account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ravi"
                required
                className="w-full h-10 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-white px-3 text-sm placeholder:text-[#555] focus:outline-none focus:border-[#6366f1] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@family.com"
                required
                className="w-full h-10 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-white px-3 text-sm placeholder:text-[#555] focus:outline-none focus:border-[#6366f1] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                  className="w-full h-10 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-white px-3 pr-10 text-sm placeholder:text-[#555] focus:outline-none focus:border-[#6366f1] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#a1a1aa]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-[#450a0a] border border-[#7f1d1d] px-3 py-2 text-sm text-[#fca5a5]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-[#6366f1] hover:bg-[#5457e5] text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-[#a1a1aa] mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-[#818cf8] hover:text-white transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-[#555] mt-4">
          New accounts need admin approval before you can bet.
        </p>
      </div>
    </div>
  )
}
