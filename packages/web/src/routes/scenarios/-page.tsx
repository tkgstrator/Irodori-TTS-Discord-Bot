import { Link } from '@tanstack/react-router'
import { Clock, ListTree, MessageSquare, RefreshCw, Users } from 'lucide-react'
import { PageContainer } from '@/components/page-container'
import { PageSuspense } from '@/components/page-suspense'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Scenario, ScenarioStatus } from '@/lib/scenarios'
import { useSuspenseResolvedScenarios } from '@/lib/scenarios'

// ジャンル表示色を定義する
const genreColors: Record<string, string> = {
  学園: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  恋愛: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  ファンタジー: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  ミステリー: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  SF: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  歴史: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  サスペンス: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  日常: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
}

// ステータス文言を返す
const getStatusLabel = (status: ScenarioStatus): string => {
  switch (status) {
    case 'completed':
      return '生成済み'
    case 'generating':
      return '生成中'
    case 'failed':
      return '失敗'
    case 'draft':
      return '未生成'
  }
}

// 章進捗の集計値を返す
const getChapterMeta = (scenario: Scenario) => {
  const createdChapters = scenario.chapters.filter((chapter) => chapter.status !== 'draft')
  const createdCount = createdChapters.length
  const completedCount = scenario.chapters.filter((chapter) => chapter.status === 'completed').length
  const activeNumbers = createdChapters.map((chapter) => chapter.number)
  const latestNumber = activeNumbers.length > 0 ? Math.max(...activeNumbers) : 0

  return {
    createdCount,
    completedCount,
    latestNumber
  }
}

// カード外観をステータス別に切り替える
const getCardBorderClass = (status: ScenarioStatus): string => {
  if (status === 'generating') {
    return 'border-blue-200 dark:border-blue-800/50'
  }

  if (status === 'draft') {
    return 'border-dashed bg-card/60'
  }

  if (status === 'failed') {
    return 'border-destructive/40 bg-destructive/5'
  }

  return 'border-border'
}

// ステータスバッジを表示する
const StatusBadge = ({ status }: { status: ScenarioStatus }) => {
  if (status === 'completed') {
    return (
      <Badge className="bg-green-500 text-white hover:bg-green-500" aria-label="生成済み">
        {getStatusLabel(status)}
      </Badge>
    )
  }

  if (status === 'generating') {
    return (
      <Badge className="bg-blue-500 text-white hover:bg-blue-500" aria-label="生成中">
        <span className="mr-1 inline-block size-1.5 animate-pulse rounded-full bg-white" />
        {getStatusLabel(status)}
      </Badge>
    )
  }

  if (status === 'failed') {
    return (
      <Badge className="bg-destructive text-white hover:bg-destructive" aria-label="失敗">
        {getStatusLabel(status)}
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" aria-label="未生成">
      {getStatusLabel(status)}
    </Badge>
  )
}

// ジャンルバッジを表示する
const GenreBadge = ({ genre }: { genre: string }) => {
  const colorClass = genreColors[genre] ?? 'bg-secondary text-secondary-foreground'

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.625rem] font-medium ${colorClass}`}>
      {genre}
    </span>
  )
}

// プロット一覧カードを表示する
const PlotCard = ({ scenario }: { scenario: Scenario }) => {
  const chapterMeta = getChapterMeta(scenario)

  return (
    <div
      className={`flex h-full w-full max-w-80 flex-col rounded-xl border bg-card transition-shadow hover:shadow-md ${getCardBorderClass(scenario.status)}`}
    >
      <div className="flex flex-1 flex-col p-3.5">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              className={`line-clamp-1 text-sm font-semibold ${scenario.status === 'draft' ? 'text-muted-foreground' : ''}`}
            >
              {scenario.title}
            </p>
            <p className="mt-0.5 text-[0.625rem] text-muted-foreground">更新: {scenario.updatedAt}</p>
          </div>
          <StatusBadge status={scenario.status} />
        </div>

        <div className="mb-3 flex flex-wrap gap-1">
          {scenario.genres.map((genre) => (
            <GenreBadge key={genre} genre={genre} />
          ))}
        </div>

        <p className="mb-2 text-xs text-muted-foreground">
          登場人物:{' '}
          <span className="font-medium text-foreground">
            {scenario.plotCharacters.length > 0 ? scenario.plotCharacters.join(' · ') : '未設定'}
          </span>
        </p>

        <p className="mb-3 text-xs text-muted-foreground">
          トーン: <span className="italic">{scenario.tone}</span>
        </p>

        <div className={`mt-auto grid grid-cols-3 gap-2 ${scenario.status === 'draft' ? 'opacity-50' : ''}`}>
          <div className="flex flex-col items-center rounded-lg bg-secondary/50 px-2 py-1.5">
            <ListTree className="size-3.5 text-muted-foreground" aria-hidden="true" />
            <span className="mt-1 text-sm font-semibold">
              {chapterMeta.latestNumber > 0 ? `第${chapterMeta.latestNumber}` : '—'}
            </span>
            <span className="text-[0.625rem] text-muted-foreground">最新章</span>
          </div>
          <div className="flex flex-col items-center rounded-lg bg-secondary/50 px-2 py-1.5">
            <MessageSquare className="size-3.5 text-muted-foreground" aria-hidden="true" />
            <span className="mt-1 text-sm font-semibold">{scenario.cueCount}</span>
            <span className="text-[0.625rem] text-muted-foreground">セリフ</span>
          </div>
          <div className="flex flex-col items-center rounded-lg bg-secondary/50 px-2 py-1.5">
            <Users className="size-3.5 text-muted-foreground" aria-hidden="true" />
            <span className="mt-1 text-sm font-semibold">{scenario.speakerCount}</span>
            <span className="text-[0.625rem] text-muted-foreground">話者</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border px-3.5 py-2.5">
        <div className="flex items-center gap-1 text-[0.625rem] text-muted-foreground">
          <Clock className="size-3" aria-hidden="true" />
          <span>{scenario.durationMinutes ?? '—'}分</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs" aria-label="再生成">
            <RefreshCw className="mr-1 size-3.5" />
            再生成
          </Button>
          <Button asChild size="sm" className="h-8 px-2.5 text-xs">
            <Link to="/scenarios/$id" params={{ id: scenario.id }}>
              詳細
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

// プロット管理ページを表示する
const ScenariosPageContent = () => {
  const { scenarios } = useSuspenseResolvedScenarios([], { pollMode: 'all' })
  const completedCount = scenarios.filter((scenario) => scenario.status === 'completed').length
  const generatingCount = scenarios.filter((scenario) => scenario.status === 'generating').length
  const failedCount = scenarios.filter((scenario) => scenario.status === 'failed').length
  const draftCount = scenarios.filter((scenario) => scenario.status === 'draft').length

  return (
    <PageContainer maxWidth="6xl">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">プロット管理</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">現在どこまで章を作成したかを一覧で確認できます</p>
        </div>

        <div className="text-sm text-muted-foreground">
          全 <strong className="text-foreground">{scenarios.length}</strong> プロット | 生成済み:{' '}
          <strong className="text-green-500">{completedCount}</strong> | 生成中:{' '}
          <strong className="text-blue-500">{generatingCount}</strong> | 未生成:{' '}
          <strong className="text-muted-foreground">{draftCount}</strong> | 失敗:{' '}
          <strong className="text-destructive">{failedCount}</strong>
        </div>

        {scenarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
            <p className="text-sm text-muted-foreground">プロットがまだ作成されていません</p>
          </div>
        ) : (
          <div className="grid justify-items-center gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {scenarios.map((scenario) => (
              <PlotCard key={scenario.id} scenario={scenario} />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  )
}

export const ScenariosPage = () => (
  <PageSuspense label="プロットを読み込み中です">
    <ScenariosPageContent />
  </PageSuspense>
)
