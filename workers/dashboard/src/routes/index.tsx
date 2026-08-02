import { createFileRoute, Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import { ArrowRight, BookText, Mic2, Users } from 'lucide-react'
import { LoginPanel } from '@/components/login-panel'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useMe } from '@/lib/auth'

interface FeatureItem {
  to: string
  label: string
  description: string
  Icon: LucideIcon
  available: boolean
}

const FEATURES: readonly FeatureItem[] = [
  {
    to: '/voice',
    label: '話者設定',
    description: '自分のメッセージを読み上げる声と、細かなパラメータを調整します。',
    Icon: Mic2,
    available: true
  },
  {
    to: '/server',
    label: 'サーバー設定',
    description: '読み上げ対象チャンネルや入退室アナウンスを切り替えます。',
    Icon: Users,
    available: true
  },
  {
    to: '/voice',
    label: '読み方辞書',
    description: 'サーバーごとに単語の読み方を登録します。',
    Icon: BookText,
    available: false
  }
] as const

/**
 * 機能リスト1行分の中身
 *
 * 利用可能な行はアイコンをプライマリ色で立たせ、準備中の行は色を落として区別する。
 */
function FeatureRowBody({ feature }: { feature: FeatureItem }) {
  return (
    <>
      <span
        className={
          feature.available
            ? 'flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'
            : 'flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground'
        }
      >
        <feature.Icon className="size-4" />
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center gap-2 font-medium text-sm">
          {feature.label}
          {!feature.available && (
            <Badge variant="outline" className="font-normal">
              準備中
            </Badge>
          )}
        </span>
        <span className="text-muted-foreground text-sm">{feature.description}</span>
      </span>

      {feature.available && (
        <ArrowRight className="size-4 shrink-0 self-center text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
      )}
    </>
  )
}

/**
 * ヘアライン区切りの機能リスト
 */
function FeatureList() {
  return (
    <div className="divide-y border-y">
      {FEATURES.map((feature) =>
        feature.available ? (
          <Link
            key={feature.label}
            to={feature.to}
            className="group flex items-start gap-4 py-5 transition-colors hover:bg-muted/40"
          >
            <FeatureRowBody feature={feature} />
          </Link>
        ) : (
          <div key={feature.label} className="flex items-start gap-4 py-5 opacity-60">
            <FeatureRowBody feature={feature} />
          </div>
        )
      )}
    </div>
  )
}

function HomePage() {
  const { me, isPending } = useMe()

  if (isPending) {
    return (
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    )
  }

  if (me === null) {
    return <LoginPanel />
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="font-brand font-bold text-3xl tracking-tight">
          こんにちは、{me.globalName === null ? me.username : me.globalName} さん
        </h1>
        <p className="text-muted-foreground text-sm">
          ここで変更した設定は、Discord での次の読み上げからすぐに反映されます。
        </p>
      </div>

      <FeatureList />
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: HomePage
})
