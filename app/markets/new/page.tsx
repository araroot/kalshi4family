'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CalendarDays, HelpCircle, Sparkles, ImageIcon, Coins } from 'lucide-react'
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
  const [refining, setRefining] = useState(false)
  const [generatingIcon, setGeneratingIcon] = useState(false)
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const minDate = new Date()
  minDate.setMinutes(minDate.getMinutes() + 30)
  const minDateStr = minDate.toISOString().slice(0, 16)

  async function refineDescription() {
    if (!title.trim()) { setError('Add a question first so AI has context'); return }
    setError('')
    setRefining(true)
    setDescription('')

    try {
      const res = await fetch('/api/ai/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      })
      if (!res.ok) { setError('AI refinement failed — check your API key'); setRefining(false); return }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let result = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        result += decoder.decode(value, { stream: true })
        setDescription(result)
      }
    } catch {
      setError('AI refinement failed')
      setRefining(false)
      return
    }
    setRefining(false)

    // Auto-generate icon after description is refined
    generateIcon()
  }

  async function generateIcon() {
    if (!title.trim()) return
    setGeneratingIcon(true)
    setPendingImageUrl(null)
    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      })
      if (res.ok) {
        const { url } = await res.json()
        setPendingImageUrl(url)
      }
    } catch {
      // Icon generation is non-critical, fail silently
    }
    setGeneratingIcon(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!title.trim()) { setError('Title is required'); return }
    if (!closeDate) { setError('Close date is required'); return }
    if (new Date(closeDate) <= new Date()) { setError('Close date must be in the future'); return }

    setLoading(true)
    const res = await fetch('/api/markets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || null,
        close_date: new Date(closeDate).toISOString(),
        category,
        image_url: pendingImageUrl ?? null,
        icon_generation_count: pendingImageUrl ? 1 : 0,
      }),
    })

    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Failed to create market')
      setLoading(false)
    } else {
      const data = await res.json()
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
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#555]">{description.length}/5000</span>
                <button
                  type="button"
                  onClick={refineDescription}
                  disabled={refining || generatingIcon || !title.trim()}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-[#312e81]/60 border border-[#4338ca]/50 text-[#a5b4fc] hover:bg-[#312e81] hover:border-[#6366f1]"
                >
                  <Sparkles className={`w-3 h-3 ${refining ? 'animate-spin' : ''}`} />
                  {refining ? 'Refining…' : generatingIcon ? 'Generating icon…' : 'Refine with AI'}
                </button>
              </div>
            </div>
            <textarea
              ref={textareaRef}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={"Add context, rules for resolution, source of truth…\n\nMarkdown supported: **bold**, _italic_, bullet lists, etc.\n\nOr click \"Refine with AI\" to generate a precise description + icon."}
              rows={8}
              maxLength={5000}
              className={`w-full rounded-lg bg-[#1a1a1a] border text-white px-3 py-2.5 text-sm placeholder:text-[#555] focus:outline-none transition-colors resize-y font-mono leading-relaxed ${
                refining ? 'border-[#4338ca]/70 animate-pulse' : 'border-[#2a2a2a] focus:border-[#6366f1]'
              }`}
            />
            <p className="text-xs text-[#555] mt-1">Markdown supported — **bold**, _italic_, `code`, bullet lists, ## headings</p>
          </div>

          {/* Icon preview */}
          {(generatingIcon || pendingImageUrl) && (
            <div className="flex items-center gap-3 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] p-3">
              {generatingIcon ? (
                <div className="w-14 h-14 rounded-xl bg-[#2a2a2a] flex items-center justify-center shrink-0 animate-pulse">
                  <ImageIcon className="w-5 h-5 text-[#555]" />
                </div>
              ) : pendingImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={pendingImageUrl} alt="Market icon" width={56} height={56} className="rounded-xl object-cover shrink-0" />
              ) : null}
              <div>
                <p className="text-xs font-medium text-white">
                  {generatingIcon ? 'Generating AI icon…' : 'Icon ready ✓'}
                </p>
                <p className="text-xs text-[#555]">
                  {generatingIcon ? 'This takes ~5 seconds' : 'Will be attached to this market'}
                </p>
                {!generatingIcon && pendingImageUrl && (
                  <button type="button" onClick={generateIcon} className="text-xs text-[#6366f1] hover:underline mt-0.5">
                    Regenerate
                  </button>
                )}
              </div>
            </div>
          )}

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

          {/* Stake + resolution note */}
          <div className="space-y-2">
            <div className="flex items-start gap-2 rounded-lg bg-[#1a1a1a] border border-[#f59e0b]/30 p-3">
              <Coins className="w-4 h-4 text-[#f59e0b] shrink-0 mt-0.5" />
              <p className="text-xs text-[#a1a1aa]">
                Creating a market requires a <span className="text-[#f59e0b] font-semibold">100 pt stake</span> held in escrow. You get it back when you resolve the market. Close early and it&apos;s burned (or distributed to bettors).
              </p>
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] p-3">
              <HelpCircle className="w-4 h-4 text-[#6366f1] shrink-0 mt-0.5" />
              <p className="text-xs text-[#a1a1aa]">
                As the creator, <span className="text-white">you resolve this market</span> after it closes. You&apos;re the final arbiter — others can file a dispute which you must respond to.
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-[#450a0a] border border-[#7f1d1d] px-3 py-2 text-sm text-[#fca5a5]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || refining || generatingIcon}
            className="w-full h-10 rounded-lg bg-[#6366f1] hover:bg-[#5457e5] text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating…' : 'Create Market'}
          </button>
        </form>
      </div>
    </div>
  )
}
