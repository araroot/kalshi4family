'use client'
import { useState } from 'react'
import { MessageCircle, Copy, Check } from 'lucide-react'

interface Props {
  text: string
}

export default function WeeklyReportShare({ text }: Props) {
  const [copied, setCopied] = useState(false)

  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`

  async function copyText() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={copyText}
        title="Copy report text"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-[#a1a1aa] hover:text-white hover:border-[#333] text-sm font-medium transition-colors"
      >
        {copied ? <Check className="w-4 h-4 text-[#22c55e]" /> : <Copy className="w-4 h-4" />}
        {copied ? 'Copied!' : 'Copy'}
      </button>

      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#1ebe5a] text-white text-sm font-semibold transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
        Share on WhatsApp
      </a>
    </div>
  )
}
