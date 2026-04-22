import { createFileRoute, Link, Outlet, useLocation, useMatches, useParams } from '@tanstack/react-router'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Loader2,
  MessageSquare,
  Play,
  RefreshCw,
  Sparkles,
  Users
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Chapter, ChapterStatus, Scenario, Speaker } from '@/lib/scenarios'
import { useScenarios } from '@/lib/scenarios'

export const Route = createFileRoute('/scenarios/$id')({
  component: ScenarioDetailPage
})

const GENRE_COLORS: Record<string, string> = {
  学園: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  恋愛: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  ファンタジー: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  ミステリー: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  SF: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  歴史: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  サスペンス: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  日常: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
}

function SpeakerAvatar({ speaker, dimmed }: { speaker: Speaker; dimmed?: boolean }) {
  return (
    <span
      className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold ${speaker.colorClass} ${dimmed ? 'opacity-50' : ''}`}
      title={speaker.name}
    >
      {speaker.initial}
    </span>
  )
}

function ChapterStatusBadge({ status }: { status: ChapterStatus }) {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300">
        <Check className="size-2.5" strokeWidth={2.5} />
        生成済み
      </span>
    )
  }
  if (status === 'generating') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
        <Loader2 className="size-2.5 animate-spin" />
        生成中
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
      未生成
    </span>
  )
}

function timelineNodeCls(status: ChapterStatus): string {
  if (status === 'completed') return 'bg-primary border-primary'
  if (status === 'generating') return 'bg-amber-400 border-amber-400 animate-pulse'
  return 'border-border bg-background'
}

function chapterBorderCls(status: ChapterStatus): string {
  if (status === 'generating') return 'border-amber-200 dark:border-amber-800/50'
  if (status === 'draft') return 'border-dashed border-border bg-card/60'
  return 'border-border'
}

function ChapterCard({ chapter, scenario, isLast }: { chapter: Chapter; scenario: Scenario; isLast: boolean }) {
  const speakers = chapter.speakers
    .map((alias) => scenario.speakers.find((s) => s.alias === alias))
    .filter((s): s is Speaker => s != null)
  const isDraft = chapter.status === 'draft'

  return (
    <div className={`relative flex gap-5 ${isLast ? 'pb-2' : 'pb-8'}`}>
      <div className="flex w-8 shrink-0 flex-col items-center">
        <div className={`mt-5 size-4 shrink-0 rounded-full border-2 ${timelineNodeCls(chapter.status)}`} />
        {!isLast && <div className="w-px flex-1 bg-border" />}
      </div>
      <div
        className={`flex-1 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md ${chapterBorderCls(chapter.status)}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">第{chapter.number}章</span>
              <span className={`text-sm font-semibold ${isDraft ? 'text-muted-foreground' : ''}`}>{chapter.title}</span>
              <ChapterStatusBadge status={chapter.status} />
            </div>
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{chapter.cueCount} cues</span>
              <span>·</span>
              <span>約{chapter.durationMinutes}分</span>
            </div>
            <p className={`mb-3 text-sm ${isDraft ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
              {chapter.synopsis}
            </p>
            <div className="flex items-center gap-1.5">
              {speakers.map((s) => (
                <SpeakerAvatar key={s.alias} speaker={s} dimmed={isDraft} />
              ))}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {chapter.status === 'completed' && (
              <>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" asChild>
                  {isPlotsRoute ? (
                    <Link to="/plots/$id/chapters/$chapterId" params={{ id: scenario.id, chapterId: chapter.id }}>
                      詳細を見る
                      <ChevronRight className="size-3" />
                    </Link>
                  ) : (
                    <Link to="/scenarios/$id/chapters/$chapterId" params={{ id: scenario.id, chapterId: chapter.id }}>
                      詳細を見る
                      <ChevronRight className="size-3" />
                    </Link>
                  )}
                </Button>
                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" aria-label="再生成">
                  <RefreshCw className="size-3.5" />
                </Button>
              </>
            )}
            {chapter.status === 'generating' && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-medium text-amber-600 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-400 h-8">
                <Loader2 className="size-3 animate-spin" />
                処理中...
              </span>
            )}
            {chapter.status === 'draft' && (
              <Button size="sm" className="h-8 gap-1.5 text-xs">
                <Play className="size-3" />
                この章から生成
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ScenarioDetailPage() {
  const { id } = useParams({ strict: false })
  const { pathname } = useLocation()
  const { getScenario } = useScenarios()
  const scenario = getScenario(id)
  const matches = useMatches()
  const isPlotsRoute = pathname.startsWith('/plots')
  const hasChildRoute = matches.some(
    (m) => m.routeId === '/scenarios/$id/chapters/$chapterId' || m.routeId === '/plots/$id/chapters/$chapterId'
  )

  if (hasChildRoute) {
    return <Outlet />
  }

  if (!scenario) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">シナリオが見つかりません</p>
      </div>
    )
  }

  const completedChapters = scenario.chapters.filter((c) => c.status === 'completed').length
  const totalChapters = scenario.chapters.length
  const progressPercent = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0
  const speakerNames = scenario.speakers.map((s) => s.name).join('・')

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="sticky top-0 z-10 -mx-6 bg-background/95 px-6 pt-2 pb-5 backdrop-blur-sm">
        <Link
          to={isPlotsRoute ? '/plots' : '/scenarios'}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" />
          {isPlotsRoute ? 'プロット管理に戻る' : 'シナリオ管理に戻る'}
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-semibold">{scenario.title}</h1>
              <Badge
                className={
                  scenario.status === 'completed'
                    ? 'bg-green-500 text-white hover:bg-green-500'
                    : scenario.status === 'generating'
                      ? 'bg-blue-500 text-white hover:bg-blue-500'
                      : ''
                }
                variant={scenario.status === 'draft' ? 'secondary' : 'default'}
              >
                {scenario.status === 'completed' ? '生成済み' : scenario.status === 'generating' ? '生成中' : '未生成'}
              </Badge>
              {scenario.isAiGenerated && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-100 px-1.5 py-0.5 text-xs text-violet-600 dark:bg-violet-900/40 dark:text-violet-300">
                  <Sparkles className="size-2.5" />
                  AI生成
                </span>
              )}
              {scenario.genres.map((genre) => (
                <span
                  key={genre}
                  className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs ${GENRE_COLORS[genre] ?? 'bg-secondary text-secondary-foreground'}`}
                >
                  {genre}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>
                トーン: <span className="italic text-foreground">{scenario.tone}</span>
              </span>
              <span className="text-border">|</span>
              <span className="flex items-center gap-1">
                <Users className="size-3" />
                {scenario.speakerCount}話者: <span className="font-medium text-foreground">{speakerNames}</span>
              </span>
              <span className="text-border">|</span>
              <span className="flex items-center gap-1">
                <MessageSquare className="size-3" />全{scenario.cueCount} cues
              </span>
              <span className="text-border">|</span>
              <span className="flex items-center gap-1">
                <Clock className="size-3" />約{scenario.durationMinutes ?? '—'}分
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 pt-0.5">
            <Button variant="outline" className="gap-2">
              <RefreshCw className="size-3.5" />
              全体を再生成
            </Button>
            <Button className="gap-2">
              <Download className="size-3.5" />
              VDS出力
            </Button>
          </div>
        </div>
        <div className="mt-5 border-b border-border" />
      </div>

      <div className="relative mt-2">
        {scenario.chapters.map((chapter, i) => (
          <ChapterCard
            key={chapter.id}
            chapter={chapter}
            scenario={scenario}
            isLast={i === scenario.chapters.length - 1}
          />
        ))}
      </div>

      {totalChapters > 0 && (
        <>
          <div className="mt-8 flex items-center justify-center gap-3 rounded-xl border border-border bg-card px-5 py-3 text-xs text-muted-foreground">
            <span>
              全 <strong className="font-semibold text-foreground">{totalChapters}</strong> 章
            </span>
            <span className="text-border">|</span>
            <span>
              生成済み: <strong className="font-semibold text-green-500">{completedChapters}</strong> / {totalChapters}
            </span>
            <span className="text-border">|</span>
            <span>
              合計 <strong className="font-semibold text-foreground">{scenario.cueCount}</strong> cues
            </span>
            <span className="text-border">|</span>
            <span>
              推定再生時間:{' '}
              <strong className="font-semibold text-foreground">約{scenario.durationMinutes ?? '—'}分</strong>
            </span>
          </div>

          <div className="mt-3 mb-8">
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-1.5 text-center text-xs text-muted-foreground">生成進捗: {progressPercent}%</p>
          </div>
        </>
      )}
    </div>
  )
}
