import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kalshi4Family',
  description: 'Family prediction markets — bet points, have fun',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-[#0a0a0a] text-[#f5f5f5] antialiased">
        {children}
      </body>
    </html>
  )
}
