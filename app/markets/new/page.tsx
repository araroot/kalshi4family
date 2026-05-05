'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, CalendarDays, HelpCircle } from 'lucide-react'
import Link from 'next/link'

const CATEGORIES = ['General', 'Sports', 'Family', 'Politics', 'Entertainment', 'Finance']

export const dynamic = 'force-dynamic'

export default function NewMarketPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('General')
  const [closeDate, setCloseDate] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const minDate = new Date()
  minDate.setMinutes(minDate.getMinutes() + 30)
  const minDateStr = minDate.toISOString().slice(0, 16)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!title.trim()) { setError('Title is required'); return }
    if (!closeDate) { setError('Close date is required'); return }
    if (new Date(closeDate) <= new Date()) { setError('Close date must be in the future'); return }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data, error: err } = await supabase
      .from('markets')
      .insert({
        title: title.trim(),
        description: description.trim() || null,
        creator_id: user.id,
        close_date: new Date(closeDate).toISOString(),
        category,
        status: 'open',
      })
      .select()
      .single()

    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      router.push(`/markets/${data.id}`)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <Link href="/markets" className="flex items-center gap-1.5 text-sm text-[#a1a1aa] hover:text-white transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to markets
      </Link>

      <div className="rounded-2xl border border-[#2a2a2a] bg-[#111] p-6">
        <h1 className="text-xl font-bold text-white mb-1">Create a Market</h1>
        <p className="text-sm text-[#555] mb-6">Ask a yes/no question. Betting locks at the close date.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
              Question <span className="text-[#ef4444]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Will India win the next cricket match?"
              required
              maxLength={300}
              className="w-full h-10 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-white px-3 text-sm placeholder:text-[#555] focus:outline-none focus:border-[#6366f1] transition-colors"
            />
            <p className="text-xs text-[#555] mt-1">{title.length}/300</p>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-[#a1a1aa]">
                Description <span className="text-[#555] font-normal">(optional)</span>
              </label>
              <span className="text-xs text-[#555]">{description.length}/5000</span>
            </div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={"Add context, rules for resolution, source of truth…\n\nMarkdown supported: **bold**, _italic_, bullet lists, etc."}
              rows={8}
              maxLength={5000}
              className="w-full rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-white px-3 py-2.5 text-sm placeholder:text-[#555] focus:outline-none focus:border-[#6366f1] transition-colors resize-y font-mono leading-relaxed"
            />
            <p className="text-xs text-[#555] mt-1">Markdown supported — **bold**, _italic_, `code`, bullet lists, ## headings</p>
          </div>

          {/* Category + Close date row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full h-10 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-white px-3 text-sm focus:outline-none focus:border-[#6366f1] transition-colors appearance-none cursor-pointer"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5" />
                  Closes at
                </span>
              </label>
              <input
                type="datetime-local"
                value={closeDate}
                onChange={e => setCloseDate(e.target.value)}
                min={minDateStr}
                required
                className="w-full h-10 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-white px-3 text-sm focus:outline-none focus:border-[#6366f1] transition-colors"
              />
            </div>
          </div>

          {/* Resolution note */}
          <div className="flex items-start gap-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] p-3">
            <HelpCircle className="w-4 h-4 text-[#6366f1] shrink-0 mt-0.5" />
            <p className="text-xs text-[#a1a1aa]">
              As the creator, <span className="text-white">you resolve this market</span> after it closes. You&apos;re the final arbiter — others can file a dispute which you must respond to.
            </p>
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
            {loading ? 'Creating…' : 'Create Market'}
          </button>
        </form>
      </div>
    </div>
  )
}
