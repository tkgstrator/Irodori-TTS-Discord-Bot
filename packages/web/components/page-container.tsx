import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

// ページ共通の外側余白を揃えるコンテナ。
export const PageContainer = ({
  className,
  maxWidth = 'full',
  ...props
}: ComponentProps<'div'> & {
  readonly maxWidth?: 'full' | '6xl'
}) => {
  const widthClass = maxWidth === '6xl' ? 'mx-auto max-w-6xl' : 'w-full'

  return <div className={cn('pt-4 sm:p-6', widthClass, className)} {...props} />
}
