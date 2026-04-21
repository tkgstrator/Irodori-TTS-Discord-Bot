import type { ReactNode } from 'react'
import { Providers } from '@/components/providers'
import './globals.css'

export const metadata = {
  title: 'Irodori TTS',
  description: 'キャラクターの関係性を可視化し、ボイスドラマを生成するツール'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
