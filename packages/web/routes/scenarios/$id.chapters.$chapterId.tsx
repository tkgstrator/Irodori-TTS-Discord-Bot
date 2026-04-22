import { createFileRoute, Link, useLocation, useParams } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, Download, Loader2, Pause, RefreshCw, Sparkles } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Cue, Speaker } from '@/lib/scenarios'
import { canRegenerateChapter, useScenarios } from '@/lib/scenarios'

const SpeakerAvatar = ({ speaker, size = 'md' }: { speaker: Speaker; size?: 'sm' | 'md' }) => {
  const sizeClass = size === 'sm' ? 'size-4 text-[9px]' : 'size-8 text-xs'

  return (
    <Avatar className={sizeClass} title={speaker.name}>
      <AvatarImage src={speaker.imageUrl ?? undefined} alt="" />
      <AvatarFallback className={speaker.colorClass}>{speaker.initial}</AvatarFallback>
    </Avatar>
  )
}

const SpeechCueCard = ({ cue, speaker }: { cue: Cue & { kind: 'speech' }; speaker: Speaker | undefined }) => {
  const isNarrator = speaker?.alias === 'narrator'

  return (
    <div
      className={`rounded-xl border border-border px-4 py-3 transition-shadow hover:shadow-md ${isNarrator ? 'bg-secondary/40' : 'bg-card'}`}
    >
      <div className="flex items-start gap-3">
        {speaker && <SpeakerAvatar speaker={speaker} />}
        <div className="min-w-0 flex-1">
          <p className={`mb-1 text-xs font-semibold ${speaker?.nameColor ?? 'text-muted-foreground'}`}>
            {speaker?.name ?? cue.speaker}
          </p>
          <p className="text-sm leading-relaxed">{cue.text}</p>
        </div>
      </div>
    </div>
  )
}

const PauseCueRow = ({ duration }: { duration: number }) => {
  return (
    <div className="flex items-center justify-center gap-2 py-1">
      <div className="h-px w-12 bg-border" />
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Pause className="size-2.5" />
        {duration}秒
      </span>
      <div className="h-px w-12 bg-border" />
    </div>
  )
}

export const ChapterDetailPage = () => {
  const { id, chapterId } = useParams({ strict: false })
  const { pathname } = useLocation()
  const { getScenario } = useScenarios()
  const scenario = getScenario(id)
  const isPlotsRoute = pathname.startsWith('/plots')

  if (!scenario) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">シナリオが見つかりません</p>
      </div>
    )
  }

  const chapterIndex = scenario.chapters.findIndex((c) => c.id === chapterId)
  const chapter = scenario.chapters[chapterIndex]

  if (!chapter) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">章が見つかりません</p>
      </div>
    )
  }

  const prevChapter = chapterIndex > 0 ? scenario.chapters[chapterIndex - 1] : undefined
  const nextChapter = chapterIndex < scenario.chapters.length - 1 ? scenario.chapters[chapterIndex + 1] : undefined

  const chapterSpeakers = chapter.speakers
    .map((alias) => scenario.speakers.find((s) => s.alias === alias))
    .filter((s): s is Speaker => s != null)

  const speechCueCount = chapter.cues.filter((c) => c.kind === 'speech').length
  const regenHint =
    chapter.status !== 'completed'
      ? '生成済みの章のみ再生成できます'
      : canRegenerateChapter(scenario.chapters, chapter.id)
        ? null
        : '後続の章があるため、この章は再生成できません'
  const canRegen = regenHint === null

  return (
    <div className="sm:px-6">
      <div className="sticky top-0 z-10 -mx-6 bg-background/95 px-6 pb-5 backdrop-blur-sm">
        <div className="w-full">
          <Link
            to={isPlotsRoute ? '/plots/$id' : '/scenarios/$id'}
            params={{ id }}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-3.5" />
            {scenario.title}
          </Link>

          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">第{chapter.number}章</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{chapter.title}</h1>
                <Badge
                  className={chapter.status === 'completed' ? 'bg-green-500 text-white hover:bg-green-500' : ''}
                  variant={chapter.status === 'completed' ? 'default' : 'secondary'}
                >
                  {chapter.status === 'completed' ? '生成済み' : chapter.status === 'generating' ? '生成中' : '未生成'}
                </Badge>
                {scenario.isAiGenerated && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-100 px-1.5 py-0.5 text-xs text-violet-600 dark:bg-violet-900/40 dark:text-violet-300">
                    <Sparkles className="size-2.5" />
                    AI生成
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{scenario.title} の章詳細とセリフを確認できます</p>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
                <span>{chapter.cueCount} cues</span>
                <span className="hidden text-border sm:inline">|</span>
                <span>約{chapter.durationMinutes}分</span>
                <span className="hidden text-border sm:inline">|</span>
                <div className="flex items-center gap-1.5">
                  {chapterSpeakers.map((s) => (
                    <SpeakerAvatar key={s.alias} speaker={s} size="sm" />
                  ))}
                  <span className="ml-1">{chapterSpeakers.length}話者</span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {prevChapter ? (
                  <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" asChild>
                    {isPlotsRoute ? (
                      <Link to="/plots/$id/chapters/$chapterId" params={{ id, chapterId: prevChapter.id }}>
                        <ChevronLeft className="size-3" />
                        前の章
                      </Link>
                    ) : (
                      <Link to="/scenarios/$id/chapters/$chapterId" params={{ id, chapterId: prevChapter.id }}>
                        <ChevronLeft className="size-3" />
                        前の章
                      </Link>
                    )}
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" disabled>
                    <ChevronLeft className="size-3" />
                    前の章
                  </Button>
                )}
                {nextChapter ? (
                  <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" asChild>
                    {isPlotsRoute ? (
                      <Link to="/plots/$id/chapters/$chapterId" params={{ id, chapterId: nextChapter.id }}>
                        次の章
                        <ChevronRight className="size-3" />
                      </Link>
                    ) : (
                      <Link to="/scenarios/$id/chapters/$chapterId" params={{ id, chapterId: nextChapter.id }}>
                        次の章
                        <ChevronRight className="size-3" />
                      </Link>
                    )}
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" disabled>
                    次の章
                    <ChevronRight className="size-3" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto md:shrink-0 md:pt-0.5">
              {canRegen ? (
                <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs sm:w-auto">
                  <RefreshCw className="size-3" />
                  この章を再生成
                </Button>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs sm:w-auto" disabled>
                        <RefreshCw className="size-3" />
                        この章を再生成
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{regenHint}</TooltipContent>
                </Tooltip>
              )}
              <Button size="sm" className="w-full gap-1.5 text-xs sm:w-auto">
                <Download className="size-3" />
                VDS出力
              </Button>
            </div>
          </div>
          <div className="mt-5 border-b border-border" />
        </div>
      </div>

      <div className="mx-auto max-w-3xl py-8">
        {chapter.cues.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
            {chapter.status === 'generating' ? (
              <>
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">セリフを生成中です...</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">この章にはまだセリフがありません</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {chapter.cues.map((cue, i) => {
              const key = `cue-${i}`
              if (cue.kind === 'pause') {
                return <PauseCueRow key={key} duration={cue.duration} />
              }
              const speaker = scenario.speakers.find((s) => s.alias === cue.speaker)
              return <SpeechCueCard key={key} cue={cue} speaker={speaker} />
            })}
          </div>
        )}

        {chapter.cues.length > 0 && (
          <div className="mt-6 flex items-center gap-6 rounded-xl border border-border bg-secondary/40 px-4 py-3 text-xs text-muted-foreground">
            <span>
              表示中: {speechCueCount} / {chapter.cueCount} cues
            </span>
            <span className="text-border">·</span>
            <span>第{chapter.number}章</span>
            <span className="text-border">·</span>
            <span>推定再生時間: ~{chapter.durationMinutes}分</span>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          {prevChapter ? (
            <Button variant="outline" className="gap-2" asChild>
              {isPlotsRoute ? (
                <Link to="/plots/$id/chapters/$chapterId" params={{ id, chapterId: prevChapter.id }}>
                  <ChevronLeft className="size-3.5" />
                  前の章
                </Link>
              ) : (
                <Link to="/scenarios/$id/chapters/$chapterId" params={{ id, chapterId: prevChapter.id }}>
                  <ChevronLeft className="size-3.5" />
                  前の章
                </Link>
              )}
            </Button>
          ) : (
            <Button variant="outline" className="gap-2" disabled>
              <ChevronLeft className="size-3.5" />
              前の章
            </Button>
          )}
          {nextChapter ? (
            <Button variant="outline" className="gap-2" asChild>
              {isPlotsRoute ? (
                <Link to="/plots/$id/chapters/$chapterId" params={{ id, chapterId: nextChapter.id }}>
                  次の章: {nextChapter.title}
                  <ChevronRight className="size-3.5" />
                </Link>
              ) : (
                <Link to="/scenarios/$id/chapters/$chapterId" params={{ id, chapterId: nextChapter.id }}>
                  次の章: {nextChapter.title}
                  <ChevronRight className="size-3.5" />
                </Link>
              )}
            </Button>
          ) : (
            <Button variant="outline" className="gap-2" disabled>
              次の章
              <ChevronRight className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/scenarios/$id/chapters/$chapterId')({
  component: ChapterDetailPage
})
