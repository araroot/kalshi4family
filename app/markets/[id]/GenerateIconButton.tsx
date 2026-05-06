'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, ImageIcon, Coins, AlertTriangle } from 'lucide-react'

interface Props {
  marketId: string
  title: string
  description: string | null
  imageUrl: string | null
  generationCount: number
}

const FREE_GENERATIONS = 2
const COST_PTS = 10

export default function GenerateIconButton({ marketId, title, description, imageUrl, generationCount: initialCount }: Props) {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [count, setCount] = useState(initialCount)
  const [confirming, setConfirming] = useState(false)

  const isFree = count < FREE_GENERATIONS
  const remaining = Math.max(0, FREE_GENERATIONS - count)

  function handleClick() {
    if (!isFree && !confirming) {
      setConfirming(true)
      return
    }
    setConfirming(false)
    generate()
  }

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
        setCount(c => c + 1)
        router.refresh()
      }
    } catch {
      setError('Failed to generate icon')
    }
    setGenerating(false)
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        onClick={handleClick}
        disabled={generating}
        title={imageUrl ? 'Regenerate icon' : 'Generate icon'}
        className="relative group w-20 h-20 rounded-xl overflow-hidden shrink-0 disabled:cursor-wait"
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#1a1a1a] border border-dashed border-[#333] flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-[#555]" />
          </div>
        )}

        {/* Hover / loading overlay */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center gap-1 transition-opacity duration-150 rounded-xl
          ${generating
            ? 'bg-black/70 opacity-100'
            : 'bg-black/0 group-hover:bg-black/65 opacity-0 group-hover:opacity-100'
          }`}
        >
          <RefreshCw className={`w-5 h-5 text-white ${generating ? 'animate-spin' : ''}`} />
          <span className="text-[10px] font-semibold text-white leading-tight text-center px-1">
            {generating ? 'Generating…' : imageUrl ? 'Regenerate' : 'Generate'}
          </span>
          {!isFree && !generating && (
            <span className="flex items-center gap-0.5 text-[9px] font-bold text-[#f59e0b]">
              <Coins className="w-2.5 h-2.5" />{COST_PTS} pts
            </span>
          )}
        </div>
      </button>

      {/* Cost confirmation nudge */}
      {confirming && !generating && (
        <div className="w-32 rounded-lg bg-[#1a1a1a] border border-[#f59e0b]/40 p-2 space-y-1.5">
          <p className="flex items-center gap-1 text-[10px] font-semibold text-[#f59e0b]">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            Costs {COST_PTS} pts
          </p>
          <p className="text-[10px] text-[#777]">You've used your 2 free generations.</p>
          <div className="flex gap-1.5">
            <button
              onClick={() => { setConfirming(false); generate() }}
              className="flex-1 text-[10px] font-semibold rounded-md bg-[#f59e0b] text-black py-0.5 hover:bg-[#d97706]"
            >
              Spend
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="flex-1 text-[10px] font-semibold rounded-md bg-[#2a2a2a] text-[#a1a1aa] py-0.5 hover:bg-[#333]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Free remaining / cost label */}
      {!confirming && !generating && !error && (
        isFree ? (
          <span className="text-[10px] text-[#555] leading-tight">
            {remaining} free {remaining === 1 ? 'gen' : 'gens'} left
          </span>
        ) : (
          <span className="flex items-center gap-0.5 text-[10px] text-[#f59e0b] leading-tight">
            <Coins className="w-3 h-3" />
            {COST_PTS} pts / gen
          </span>
        )
      )}

      {error && (
        <p className="text-[11px] text-[#f87171] leading-tight w-32 break-words">{error}</p>
      )}
    </div>
  )
}
