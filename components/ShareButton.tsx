'use client'
import { Share2 } from 'lucide-react'

interface ShareButtonProps {
  text: string
  size?: 'sm' | 'md'
  className?: string
}

export default function ShareButton({ text, size = 'md', className = '' }: ShareButtonProps) {
  function share() {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (size === 'sm') {
    return (
      <button
        onClick={share}
        title="Share on WhatsApp"
        className={`flex items-center gap-1.5 text-xs text-[#a1a1aa] hover:text-[#25d366] transition-colors ${className}`}
      >
        <WhatsAppIcon className="w-3.5 h-3.5" />
        Share
      </button>
    )
  }

  return (
    <button
      onClick={share}
      title="Share on WhatsApp"
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-[#2a2a2a] bg-[#111] text-sm text-[#a1a1aa] hover:text-[#25d366] hover:border-[#25d366]/40 transition-all ${className}`}
    >
      <WhatsAppIcon className="w-4 h-4" />
      <span>Share on WhatsApp</span>
    </button>
  )
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.124 1.534 5.854L0 24l6.335-1.524A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.002-1.367l-.36-.213-3.724.896.935-3.618-.234-.373A9.818 9.818 0 1112 21.818z"/>
    </svg>
  )
}

export function ShareIcon({ className }: { className?: string }) {
  return <Share2 className={className} />
}
