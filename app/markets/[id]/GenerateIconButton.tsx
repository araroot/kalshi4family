'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, ImageIcon } from 'lucide-react'

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
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={generate}
        disabled={generating}
        title={imageUrl ? 'Regenerate icon' : 'Generate icon'}
        className="relative group w-20 h-20 rounded-xl overflow-hidden shrink-0 disabled:cursor-wait"
      >
        {/* Icon or placeholder */}
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
        </div>
      </button>

      {/* Error shown clearly below with enough width */}
      {error && (
        <p className="text-[11px] text-[#f87171] leading-tight w-32 break-words">{error}</p>
      )}
    </div>
  )
}
