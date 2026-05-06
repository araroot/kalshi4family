'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, RefreshCw, ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface Props {
  marketId: string
  title: string
  description: string | null
  imageUrl: string | null
}

export default function GenerateIconButton({ marketId, title, description, imageUrl }: Props) {
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
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={generate}
        disabled={generating}
        title={imageUrl ? 'Regenerate icon' : 'Generate icon'}
        className="relative group w-20 h-20 rounded-xl overflow-hidden shrink-0 disabled:cursor-wait"
      >
        {/* Icon or placeholder */}
        {imageUrl ? (
          <Image src={imageUrl} alt="Market icon" width={80} height={80} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-[#555]" />
          </div>
        )}

        {/* Hover / loading overlay */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center gap-1 transition-opacity duration-150 rounded-xl
          ${generating
            ? 'bg-black/60 opacity-100'
            : 'bg-black/0 group-hover:bg-black/60 opacity-0 group-hover:opacity-100'
          }`}
        >
          {generating
            ? <RefreshCw className="w-5 h-5 text-white animate-spin" />
            : <RefreshCw className="w-5 h-5 text-white" />
          }
          <span className="text-[10px] font-semibold text-white leading-tight text-center px-1">
            {generating ? 'Generating…' : imageUrl ? 'Regenerate' : 'Generate'}
          </span>
        </div>
      </button>

      {error && <p className="text-xs text-[#f87171] max-w-[80px] leading-tight">{error}</p>}
    </div>
  )
}
