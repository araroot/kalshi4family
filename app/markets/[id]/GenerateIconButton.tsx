'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, RefreshCw } from 'lucide-react'

export default function GenerateIconButton({ marketId, title, description, hasIcon }: {
  marketId: string
  title: string
  description: string | null
  hasIcon: boolean
}) {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  async function generate() {
    setGenerating(true)
    setError('')
    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, marketId }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Failed')
      } else {
        router.refresh()
      }
    } catch {
      setError('Failed to generate icon')
    }
    setGenerating(false)
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={generate}
        disabled={generating}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-[#312e81]/60 border border-[#4338ca]/50 text-[#a5b4fc] hover:bg-[#312e81] hover:border-[#6366f1]"
      >
        {generating
          ? <RefreshCw className="w-3 h-3 animate-spin" />
          : <Sparkles className="w-3 h-3" />}
        {generating ? 'Generating…' : hasIcon ? 'Regenerate icon' : 'Generate icon'}
      </button>
      {error && <p className="text-xs text-[#f87171]">{error}</p>}
    </div>
  )
}
