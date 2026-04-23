import { createFileRoute, Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import { ArrowRight, BookOpen, Settings, Sparkles, Users } from 'lucide-react'
import { PageContainer } from '@/components/page-container'
import { Button } from '@/components/ui/button'

type HomeAction = {
  readonly title: string
  readonly description: string
  readonly detail: string
  readonly to: '/characters' | '/plots' | '/settings'
  readonly cta: string
  readonly Icon: LucideIcon
}

type WorkflowItem = {
  readonly title: string
  readonly description: string
}

// ホームから遷移できる主要導線を定義する。
const homeActions: ReadonlyArray<HomeAction> = [
  {
    title: 'キャラクター管理',
    description: '登場人物の設定、口調、タグ情報を整理します。',
    detail: '最初に人物像を固めておくと、後続のシナリオ作成が安定します。',
    to: '/characters',
    cta: 'キャラクターを見る',
    Icon: Users
  },
  {
    title: 'プロット管理',
    description: 'プロットの下書きや章構成を確認します。',
    detail: '作成済みシナリオの進行状況を見ながら、次の執筆対象を選べます。',
    to: '/plots',
    cta: 'プロットを見る',
    Icon: BookOpen
  },
  {
    title: '設定',
    description: '表示テーマと作業環境を調整します。',
    detail: '長時間作業に向けて、閲覧しやすい表示モードへすぐ切り替えられます。',
    to: '/settings',
    cta: '設定を開く',
    Icon: Settings
  }
] as const

// 初回利用時に案内したい基本フローを定義する。
const workflowItems: ReadonlyArray<WorkflowItem> = [
  {
    title: '1. 登場人物を固める',
    description: 'キャラクターの属性や口調を先に整理して、世界観の前提を揃えます。'
  },
  {
    title: '2. 物語の流れを組む',
    description: 'シナリオ一覧から下書きを管理し、章ごとの流れを組み立てます。'
  },
  {
    title: '3. 関係性を見直す',
    description: '相関図でキャラクター同士の距離感を確認し、設定の矛盾を防ぎます。'
  }
] as const

// ホームの主要導線を横幅を活かした行レイアウトで描画する。
const HomeActionRow = ({ action }: { action: HomeAction }) => (
  <li className="border-b border-border/70 pb-5 last:border-b-0 last:pb-0">
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
      <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-foreground ring-1 ring-border/70">
        <action.Icon className="size-5" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold tracking-tight">{action.title}</h3>
        <p className="text-sm leading-6 text-foreground/90">{action.description}</p>
        <p className="text-sm leading-6 text-muted-foreground">{action.detail}</p>
      </div>

      <Button
        asChild
        variant="outline"
        className="col-span-2 h-11 w-full justify-between rounded-xl px-4 lg:col-span-1 lg:mt-1 lg:w-auto lg:min-w-44"
      >
        <Link to={action.to}>
          {action.cta}
          <ArrowRight data-icon="inline-end" />
        </Link>
      </Button>
    </div>
  </li>
)

// ホームの主要 CTA でアイコン付きでも文言が視覚的に中央に来るようにする。
const HomeCtaLabel = ({ icon: Icon, label }: { icon: LucideIcon; label: string }) => (
  <span className="grid w-full grid-cols-[1rem_minmax(0,1fr)_1rem] items-center gap-2">
    <Icon className="size-4" aria-hidden="true" />
    <span className="text-center">{label}</span>
    <span aria-hidden="true" />
  </span>
)

// ホーム画面を描画する。
const HomePage = () => {
  return (
    <PageContainer className="flex flex-col gap-10">
      <section aria-labelledby="home-hero-title" className="border-b border-border/80 pb-10">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)] xl:gap-10">
          <div className="space-y-5">
            <div className="space-y-3">
              <h1
                id="home-hero-title"
                className="max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
              >
                キャラクター設定、プロット整理、相関確認をここから始める
              </h1>
              <p className="max-w-3xl text-base leading-7 text-muted-foreground">
                この画面は制作の入口です。登場人物の設定、プロットの確認、相関図の見直し、表示設定の調整まで、
                物語づくりに必要な作業へ迷わず移動できます。
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild className="h-11 rounded-xl px-4 sm:min-w-48">
                <Link to="/characters/new">
                  <HomeCtaLabel icon={Sparkles} label="キャラクターを追加" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-11 rounded-xl px-4 sm:min-w-48">
                <Link to="/plots">
                  <HomeCtaLabel icon={BookOpen} label="プロット一覧へ" />
                </Link>
              </Button>
            </div>
          </div>

          <aside className="border-t border-border/70 pt-6 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-8">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold tracking-tight">おすすめの進め方</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                新規プロジェクトでも既存作業の再開でも、迷いにくい順序で整理しています。
              </p>
            </div>

            <ol className="mt-6 space-y-5">
              {workflowItems.map((item) => (
                <li key={item.title} className="border-b border-border/70 pb-5 last:border-b-0 last:pb-0">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </section>

      <section aria-labelledby="home-actions-title" className="space-y-4">
        <div className="space-y-2">
          <h2 id="home-actions-title" className="text-2xl font-semibold tracking-tight">
            主要メニュー
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            よく使う画面を一覧として広く見せ、残っている横幅を導線説明に使えるようにしています。
          </p>
        </div>

        <ul className="grid gap-x-10 gap-y-5 xl:grid-cols-2">
          {homeActions.map((action) => (
            <HomeActionRow key={action.to} action={action} />
          ))}
        </ul>
      </section>
    </PageContainer>
  )
}

export const Route = createFileRoute('/')({
  component: HomePage
})
