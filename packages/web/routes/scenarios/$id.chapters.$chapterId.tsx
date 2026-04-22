import { createFileRoute, Link, useLocation, useParams } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, Download, Loader2, Pause, RefreshCw, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Cue, Speaker } from '@/lib/scenarios'
import { useScenarios } from '@/lib/scenarios'

function SpeakerAvatar({ speaker, size = 'md' }: { speaker: Speaker; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'size-4 text-[9px]' : 'size-7 text-xs'
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold ${sizeClass} ${speaker.colorClass} shrink-0`}
      title={speaker.name}
    >
      {speaker.initial}
    </span>
  )
}

function SpeechCueCard({ cue, speaker }: { cue: Cue & { kind: 'speech' }; speaker: Speaker | undefined }) {
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

function PauseCueRow({ duration }: { duration: number }) {
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

export function ChapterDetailPage() {
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

  return (
    <>
      <div className="sticky top-0 z-20 border-b border-border bg-card/95 px-6 py-4 backdrop-blur">
        <div className="mx-auto max-w-3xl">
          <nav className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            {isPlotsRoute ? (
              <Link to="/plots" className="transition-colors hover:text-foreground">
                プロット管理
              </Link>
            ) : (
              <Link to="/scenarios" className="transition-colors hover:text-foreground">
                シナリオ管理
              </Link>
            )}
            <ChevronRight className="size-3" />
            {isPlotsRoute ? (
              <Link to="/plots/$id" params={{ id }} className="transition-colors hover:text-foreground">
                {scenario.title}
              </Link>
            ) : (
              <Link to="/scenarios/$id" params={{ id }} className="transition-colors hover:text-foreground">
                {scenario.title}
              </Link>
            )}
            <ChevronRight className="size-3" />
            <span className="font-medium text-foreground">第{chapter.number}章</span>
          </nav>

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-semibold">
                  第{chapter.number}章: {chapter.title}
                </h1>
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

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{chapter.cueCount} cues</span>
                <span className="text-border">·</span>
                <span>約{chapter.durationMinutes}分</span>
                <span className="text-border">·</span>
                <div className="flex items-center gap-1">
                  {chapterSpeakers.map((s) => (
                    <SpeakerAvatar key={s.alias} speaker={s} size="sm" />
                  ))}
                  <span className="ml-1">{chapterSpeakers.length}話者</span>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-2">
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

            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <RefreshCw className="size-3" />
                この章を再生成
              </Button>
              <Button size="sm" className="gap-1.5 text-xs">
                <Download className="size-3" />
                VDS出力
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
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
    </>
  )
}

export const Route = createFileRoute('/scenarios/$id/chapters/$chapterId')({
  component: ChapterDetailPage
})
