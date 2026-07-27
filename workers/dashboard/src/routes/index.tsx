import { createFileRoute, Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import { ArrowRight, BookText, Mic2, Users } from 'lucide-react'
import { LoginCard } from '@/components/login-card'
import { Badge } from '@/components/ui/badge'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useMe } from '@/lib/auth'

interface FeatureCard {
  to: string
  label: string
  description: string
  Icon: LucideIcon
  available: boolean
}

const FEATURES: readonly FeatureCard[] = [
  {
    to: '/voice',
    label: '話者設定',
    description: '自分のメッセージを読み上げる声と、細かなパラメータを調整します。',
    Icon: Mic2,
    available: true
  },
  {
    to: '/voice',
    label: 'サーバー設定',
    description: '読み上げ対象チャンネルや入退室アナウンスを切り替えます。',
    Icon: Users,
    available: false
  },
  {
    to: '/voice',
    label: '読み方辞書',
    description: 'サーバーごとに単語の読み方を登録します。',
    Icon: BookText,
    available: false
  }
] as const

function FeatureCardBody({ feature }: { feature: FeatureCard }) {
  return (
    <Card
      className={
        feature.available ? 'h-full transition-colors hover:border-primary/50 hover:bg-accent/40' : 'h-full opacity-60'
      }
    >
      <CardHeader className="gap-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <feature.Icon className="size-4" />
        </span>
        <CardTitle className="flex items-center gap-2 text-base">
          {feature.label}
          {feature.available ? (
            <ArrowRight className="size-3.5 text-muted-foreground" />
          ) : (
            <Badge variant="outline" className="font-normal">
              準備中
            </Badge>
          )}
        </CardTitle>
        <CardDescription>{feature.description}</CardDescription>
      </CardHeader>
    </Card>
  )
}

function FeatureGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map((feature) =>
        feature.available ? (
          <Link key={feature.label} to={feature.to} className="block">
            <FeatureCardBody feature={feature} />
          </Link>
        ) : (
          <div key={feature.label}>
            <FeatureCardBody feature={feature} />
          </div>
        )
      )}
    </div>
  )
}

function HomePage() {
  const { me, isPending } = useMe()

  if (isPending) {
    return <Skeleton className="h-56 w-full" />
  }

  if (me === null) {
    return <LoginCard />
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-brand text-2xl">こんにちは、{me.globalName ?? me.username} さん</h1>
        <p className="text-muted-foreground text-sm">
          ここで変更した設定は、Discord での次の読み上げからすぐに反映されます。
        </p>
      </div>

      <FeatureGrid />
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: HomePage
})
