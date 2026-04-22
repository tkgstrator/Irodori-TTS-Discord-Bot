import type { ReactNode } from 'react'
import './globals.css'

import { Providers } from '@/components/providers'
import { AppShell } from '@/components/shell/app-shell'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  )
}
