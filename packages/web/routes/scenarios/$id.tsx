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
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Chapter, ChapterStatus, Scenario, Speaker } from '@/lib/scenarios'
import { canRegenerateChapter, useScenarios } from '@/lib/scenarios'

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

const speakerAvatar = ({ speaker, dimmed }: { speaker: Speaker; dimmed?: boolean }) => {
  return (
    <span
      className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold ${speaker.colorClass} ${dimmed ? 'opacity-50' : ''}`}
      title={speaker.name}
    >
      {speaker.initial}
    </span>
  )
}

const chapterStatusBadge = ({ status }: { status: ChapterStatus }) => {
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

const timelineNodeCls = (status: ChapterStatus): string => {
  if (status === 'completed') return 'bg-primary border-primary'
  if (status === 'generating') return 'bg-amber-400 border-amber-400 animate-pulse'
  return 'border-border bg-background'
}

const chapterRowCls = (status: ChapterStatus): string => {
  if (status === 'generating') return 'border-amber-200/80'
  if (status === 'draft') return 'border-border/70 opacity-80'
  return 'border-border'
}

// 後続章がある場合の再生成不可理由を返す。
const getChapterRegenHint = ({
  chapter,
  scenario
}: {
  chapter: Chapter
  scenario: Scenario
}): string | null => {
  if (chapter.status !== 'completed') {
    return null
  }

  if (!canRegenerateChapter(scenario.chapters, chapter.id)) {
    return '後続の章があるため、この章は再生成できません'
  }

  return null
}

const ChapterCard = ({
  chapter,
  scenario,
  isLast,
  isPlotsRoute
}: {
  chapter: Chapter
  scenario: Scenario
  isLast: boolean
  isPlotsRoute: boolean
}) => {
  const speakers = chapter.speakers
    .map((alias) => scenario.speakers.find((speaker) => speaker.alias === alias))
    .filter((speaker): speaker is Speaker => speaker != null)
  const isDraft = chapter.status === 'draft'
  const isCompleted = chapter.status === 'completed'
  const regenHint = getChapterRegenHint({ chapter, scenario })
  const isRegenDisabled = regenHint !== null
  const chapterDetailLink = isPlotsRoute ? '/plots/$id/chapters/$chapterId' : '/scenarios/$id/chapters/$chapterId'

  return (
    <div className={`relative flex gap-5 ${isLast ? 'pb-2' : 'pb-8'}`}>
      <div className="flex w-8 shrink-0 flex-col items-center">
        <div className={`mt-5 size-4 shrink-0 rounded-full border-2 ${timelineNodeCls(chapter.status)}`} />
        {!isLast && <div className="w-px flex-1 bg-border" />}
      </div>
      <div className={`flex-1 border-b pb-6 ${chapterRowCls(chapter.status)} ${isLast ? 'border-b-0 pb-0' : ''}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">第{chapter.number}章</span>
              {isCompleted ? (
                <Link
                  to={chapterDetailLink}
                  params={{ id: scenario.id, chapterId: chapter.id }}
                  className="text-sm font-semibold transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {chapter.title}
                </Link>
              ) : (
                <span className={`text-sm font-semibold ${isDraft ? 'text-muted-foreground' : ''}`}>{chapter.title}</span>
              )}
              {chapterStatusBadge({ status: chapter.status })}
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
              {speakers.map((speaker) => (
                <span key={speaker.alias}>{speakerAvatar({ speaker, dimmed: isDraft })}</span>
              ))}
            </div>
          </div>
          <div className="relative z-20 flex items-center gap-1.5 self-end sm:shrink-0">
            {chapter.status === 'completed' && (
              <>
                {isRegenDisabled ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground"
                          aria-label="再生成不可"
                          disabled
                        >
                          <RefreshCw className="size-3.5" />
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{regenHint}</TooltipContent>
                  </Tooltip>
                ) : (
                  <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" aria-label="再生成">
                    <RefreshCw className="size-3.5" />
                  </Button>
                )}
                <Button asChild variant="ghost" size="icon" className="size-8 text-muted-foreground" aria-label="詳細を開く">
                  <Link to={chapterDetailLink} params={{ id: scenario.id, chapterId: chapter.id }}>
                    <ChevronRight className="size-4" />
                  </Link>
                </Button>
              </>
            )}
            {chapter.status === 'generating' && (
              <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-medium text-amber-600 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-400">
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

export const ScenarioDetailPage = () => {
  const { id } = useParams({ strict: false })
  const { pathname } = useLocation()
  const { getScenario } = useScenarios()
  const scenario = getScenario(id)
  const matches = useMatches()
  const isPlotsRoute = pathname.startsWith('/plots')
  const hasChildRoute = matches.some(
    (match) =>
      match.routeId === '/scenarios/$id/chapters/$chapterId' || match.routeId === '/plots/$id/chapters/$chapterId'
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

  const createdChapters = scenario.chapters.filter((chapter) => chapter.status !== 'draft')
  const completedChapters = scenario.chapters.filter((chapter) => chapter.status === 'completed').length
  const createdChapterCount = createdChapters.length
  const latestChapterNumber = createdChapters.length > 0 ? Math.max(...createdChapters.map((chapter) => chapter.number)) : 0
  const speakerNames = scenario.speakers.map((speaker) => speaker.name).join('・')
  const pagePaddingCls = isPlotsRoute ? 'sm:px-6 sm:pb-8' : 'pt-8 sm:px-6 sm:py-8'
  const headerWidthCls = isPlotsRoute ? '' : 'max-w-3xl'

  return (
    <div className={pagePaddingCls}>
      <div className="sticky top-0 z-10 -mx-6 bg-background/95 px-6 pb-5 backdrop-blur-sm">
        <div className={`w-full ${headerWidthCls} ${isPlotsRoute ? '' : 'mx-auto'}`}>
          <Link
            to={isPlotsRoute ? '/plots' : '/scenarios'}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-3.5" />
            {isPlotsRoute ? 'プロット管理に戻る' : 'シナリオ管理に戻る'}
          </Link>

          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">{scenario.title}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {isPlotsRoute ? '章ごとの進行と出力準備を確認できます' : '章ごとの生成状況と内容を確認できます'}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                {scenario.genres.map((genre) => (
                  <span
                    key={genre}
                    className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs ${GENRE_COLORS[genre] ?? 'bg-secondary text-secondary-foreground'}`}
                  >
                    {genre}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
                <span>
                  トーン: <span className="italic text-foreground">{scenario.tone}</span>
                </span>
                <span className="hidden text-border sm:inline">|</span>
                <span className="flex items-center gap-1">
                  <Users className="size-3" />
                  {scenario.speakerCount}話者: <span className="font-medium text-foreground">{speakerNames}</span>
                </span>
                <span className="hidden text-border sm:inline">|</span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="size-3" />全{scenario.cueCount} cues
                </span>
                <span className="hidden text-border sm:inline">|</span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />約{scenario.durationMinutes ?? '—'}分
                </span>
              </div>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto md:shrink-0 md:pt-0.5">
              <Button variant="outline" className="w-full gap-2 sm:w-auto">
                <RefreshCw className="size-3.5" />
                全体を再生成
              </Button>
              <Button className="w-full gap-2 sm:w-auto">
                <Download className="size-3.5" />
                VDS出力
              </Button>
            </div>
          </div>
          <div className="mt-5 border-b border-border" />
        </div>
      </div>

      <div className="mx-auto max-w-3xl pt-4">
        <div className="relative">
          {scenario.chapters.map((chapter, index) => (
            <ChapterCard
              key={chapter.id}
              chapter={chapter}
              scenario={scenario}
              isLast={index === scenario.chapters.length - 1}
              isPlotsRoute={isPlotsRoute}
            />
          ))}
        </div>

        {createdChapterCount > 0 && (
          <>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-xl border border-border bg-card px-5 py-3 text-xs text-muted-foreground">
              <span>
                作成済み <strong className="font-semibold text-foreground">{createdChapterCount}</strong> 章
              </span>
              <span className="hidden text-border sm:inline">|</span>
              <span>
                最新章: <strong className="font-semibold text-foreground">第{latestChapterNumber}章</strong>
              </span>
              <span className="hidden text-border sm:inline">|</span>
              <span>
                完了章: <strong className="font-semibold text-green-500">{completedChapters}</strong>
              </span>
              <span className="hidden text-border sm:inline">|</span>
              <span>
                合計 <strong className="font-semibold text-foreground">{scenario.cueCount}</strong> cues
              </span>
              <span className="hidden text-border sm:inline">|</span>
              <span>
                推定再生時間:{' '}
                <strong className="font-semibold text-foreground">約{scenario.durationMinutes ?? '—'}分</strong>
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/scenarios/$id')({
  component: ScenarioDetailPage
})
