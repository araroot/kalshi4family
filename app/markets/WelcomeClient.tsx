'use client'
import { useEffect, useState } from 'react'
import WelcomeModal from '@/components/WelcomeModal'

interface WelcomeClientProps {
  userId: string
  name: string
}

export default function WelcomeClient({ userId, name }: WelcomeClientProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const key = `welcomed_${userId}`
    if (!localStorage.getItem(key)) {
      setShow(true)
    }
  }, [userId])

  function dismiss() {
    localStorage.setItem(`welcomed_${userId}`, '1')
    setShow(false)
  }

  if (!show) return null
  return <WelcomeModal name={name} onClose={dismiss} />
}
