import { Link } from '@tanstack/react-router'
import { Clock, ListTree, MessageSquare, Plus, Users } from 'lucide-react'
import { PageContainer } from '@/components/page-container'
import { PageSuspense } from '@/components/page-suspense'
import { Button } from '@/components/ui/button'
import type { Scenario } from '@/lib/scenarios'
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
const getCardBorderClass = (status: Scenario['status']): string => {
  if (status === 'generating') {
    return 'border-blue-200 dark:border-blue-800/50'
  }

  if (status === 'draft') {
    return 'border-dashed bg-card/60'
  }

  return 'border-border'
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
    <Link
      to="/plots/$id"
      params={{ id: scenario.id }}
      className={`flex h-full w-full flex-col rounded-xl border bg-card transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${getCardBorderClass(scenario.status)}`}
    >
      <div className="flex h-full w-full flex-col">
        <div className="flex flex-1 flex-col p-3.5">
          <div className="mb-2">
            <div className="flex items-start justify-between gap-2">
              <p
                className={`line-clamp-1 min-w-0 text-base font-semibold ${scenario.status === 'draft' ? 'text-muted-foreground' : ''}`}
              >
                {scenario.title}
              </p>
              <div className="flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground">
                <Clock className="size-3.5" aria-hidden="true" />
                <span>{scenario.durationMinutes ?? '—'}分</span>
              </div>
            </div>
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
      </div>
    </Link>
  )
}

// プロット管理ページを表示する
const PlotsPageContent = () => {
  const { scenarios } = useSuspenseResolvedScenarios()

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">プロット管理</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">現在どこまで章を作成したかを一覧で確認できます</p>
        </div>
        <Button asChild size="lg">
          <Link to="/plots/new">
            <Plus data-icon="inline-start" />
            新規作成
          </Link>
        </Button>
      </div>

      {scenarios.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">プロットがまだ作成されていません</p>
          <Button asChild size="lg">
            <Link to="/plots/new">
              <Plus data-icon="inline-start" />
              最初のプロットを作成
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {scenarios.map((scenario) => (
            <PlotCard key={scenario.id} scenario={scenario} />
          ))}
        </div>
      )}
    </PageContainer>
  )
}

export const PlotsPage = () => (
  <PageSuspense label="プロットを読み込み中です">
    <PlotsPageContent />
  </PageSuspense>
)
