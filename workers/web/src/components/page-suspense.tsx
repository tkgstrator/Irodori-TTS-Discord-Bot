import type { ReactNode } from 'react'
import { Suspense } from 'react'

/**
 * Suspense 中のページ共通ローディングを描画する。
 */
const PageFallback = ({ label }: { label: string }) => (
  <div className="flex flex-1 items-center justify-center">
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>
)

/**
 * データ取得が必要なページを Suspense で包む。
 */
export const PageSuspense = ({ children, label }: { children: ReactNode; label: string }) => (
  <Suspense fallback={<PageFallback label={label} />}>{children}</Suspense>
)
