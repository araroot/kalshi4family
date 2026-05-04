'use client'
import { useEffect, useRef, useState } from 'react'
import { Coins, CalendarCheck, TrendingUp, X } from 'lucide-react'

interface WelcomeModalProps {
  name: string
  onClose: () => void
}

export default function WelcomeModal({ name, onClose }: WelcomeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Small delay so the modal animates in after page load
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!visible) return
    let confetti: (opts: object) => void
    import('canvas-confetti').then(mod => {
      confetti = mod.default
      const end = Date.now() + 3500

      const colors = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4']

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
          gravity: 0.8,
          scalar: 1.1,
        })
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
          gravity: 0.8,
          scalar: 1.1,
        })
        if (Date.now() < end) requestAnimationFrame(frame)
      }
      frame()

      // Big burst on open
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { x: 0.5, y: 0.55 },
        colors,
        scalar: 1.2,
      })
    })
  }, [visible])

  function close() {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) close() }}
    >
      <div
        className={`relative w-full max-w-md rounded-2xl border border-[#2a2a2a] bg-[#111] p-8 text-center transition-all duration-300 ${
          visible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
        style={{ boxShadow: '0 0 60px rgba(99,102,241,0.2), 0 25px 50px rgba(0,0,0,0.5)' }}
      >
        <button
          onClick={close}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full text-[#555] hover:text-white hover:bg-[#2a2a2a] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Emoji burst */}
        <div className="text-5xl mb-4 select-none">🎉</div>

        <h2 className="text-2xl font-bold text-white mb-1">
          Welcome, {name.split(' ')[0]}!
        </h2>
        <p className="text-[#a1a1aa] text-sm mb-6">You&apos;re officially in the family markets.</p>

        {/* Points cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl bg-gradient-to-br from-[#6366f1]/20 to-[#6366f1]/5 border border-[#6366f1]/30 p-4">
            <Coins className="w-6 h-6 text-[#f59e0b] mx-auto mb-2" />
            <p className="text-2xl font-bold text-white tabular-nums">1,000</p>
            <p className="text-xs text-[#a1a1aa] mt-0.5">Starting points</p>
            <p className="text-xs text-[#555] mt-0.5">Never expire</p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-[#22c55e]/20 to-[#22c55e]/5 border border-[#22c55e]/30 p-4">
            <CalendarCheck className="w-6 h-6 text-[#22c55e] mx-auto mb-2" />
            <p className="text-2xl font-bold text-white tabular-nums">+200</p>
            <p className="text-xs text-[#a1a1aa] mt-0.5">Every Saturday</p>
            <p className="text-xs text-[#555] mt-0.5">Use by next Sat</p>
          </div>
        </div>

        {/* Rules callout */}
        <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-4 text-left space-y-2.5 mb-6">
          <Rule icon="📅" text="200 fresh points every Saturday morning" />
          <Rule icon="💸" text="Unused Saturday points vanish the next Saturday" />
          <Rule icon="🏆" text="Points you win are yours forever — they stack up" />
          <Rule icon="🤝" text="Weekly points are spent first when you bet" />
        </div>

        <button
          onClick={close}
          className="w-full h-11 rounded-xl bg-[#6366f1] hover:bg-[#5457e5] text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          style={{ boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}
        >
          <TrendingUp className="w-4 h-4" />
          Start betting!
        </button>
      </div>
    </div>
  )
}

function Rule({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-base leading-none mt-0.5 select-none">{icon}</span>
      <p className="text-xs text-[#a1a1aa] leading-relaxed">{text}</p>
    </div>
  )
}
