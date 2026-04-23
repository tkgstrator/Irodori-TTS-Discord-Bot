import { createFileRoute, Link, useLocation, useParams } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, Loader2, Pause, RefreshCw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { PageSuspense } from '@/components/page-suspense'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { VdsPreviewDialog } from '@/components/vds-preview-dialog'
import { useSuspenseCharacters } from '@/lib/characters'
import type { ChapterCharacter, Cue, Speaker } from '@/lib/scenarios'
import { canRegenerateChapter, useScenarioMutations, useSuspenseResolvedScenarios } from '@/lib/scenarios'
import { createChapterVdsExport, createChapterVdsJsonExport } from '@/lib/vds'

const CharacterAvatar = ({ character, size = 'md' }: { character: ChapterCharacter; size?: 'sm' | 'md' }) => {
  const sizeClass = size === 'sm' ? 'size-4 text-[9px]' : 'size-8 text-xs'
  const initial = character.name.charAt(0) || '?'

  return (
    <Avatar className={sizeClass} title={character.name}>
      <AvatarImage src={character.imageUrl ?? undefined} alt="" />
      <AvatarFallback>{initial}</AvatarFallback>
    </Avatar>
  )
}

const SpeechCueCard = ({
  cue,
  speaker,
  character
}: {
  cue: Cue & { kind: 'speech' }
  speaker: Speaker | undefined
  character: ChapterCharacter | undefined
}) => {
  const isNarrator = speaker?.alias === 'yuki'

  return (
    <div
      className={`rounded-xl border border-border px-4 py-3 transition-shadow hover:shadow-md ${isNarrator ? 'bg-secondary/40' : 'bg-card'}`}
    >
      <div className="flex items-start gap-3">
        {character && <CharacterAvatar character={character} />}
        <div className="min-w-0 flex-1">
          <p className={`mb-1 text-xs font-semibold ${speaker?.nameColor ?? 'text-muted-foreground'}`}>
            {character?.name ?? speaker?.name ?? cue.speaker}
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

const ChapterDetailPageContent = () => {
  const { id, chapterId } = useParams({ strict: false })
  const { pathname } = useLocation()
  const { characters } = useSuspenseCharacters()
  const { getScenario, scenarios } = useSuspenseResolvedScenarios(characters)
  const { createEpisodeFromChapter, deleteEpisodeFromChapter } = useScenarioMutations({ scenarios })
  const scenario = getScenario(id)
  const isPlotsRoute = pathname.startsWith('/plots')
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [regenError, setRegenError] = useState<string | null>(null)

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

  const speechCueCount = chapter.cues.filter((c) => c.kind === 'speech').length
  const regenHint =
    chapter.status !== 'completed'
      ? '生成済みの章のみ再生成できます'
      : canRegenerateChapter(scenario.chapters, chapter.id)
        ? null
        : '後続の章があるため、この章は再生成できません'
  const canRegen = regenHint === null
  const deleteHint =
    chapter.status !== 'completed'
      ? '生成済みの章のみエピソードを削除できます'
      : canRegenerateChapter(scenario.chapters, chapter.id)
        ? null
        : '後続の章があるため、この章のエピソードは削除できません'
  const canDeleteEpisode = deleteHint === null
  const chapterVdsExport = createChapterVdsExport({ scenario, chapter })
  const chapterVdsJsonExport = createChapterVdsJsonExport({ scenario, chapter })
  const chapterVdsPreviewReason =
    !chapterVdsExport.ok && !chapterVdsJsonExport.ok
      ? chapterVdsExport.reason
      : !chapterVdsExport.ok
        ? chapterVdsExport.reason
        : !chapterVdsJsonExport.ok
          ? chapterVdsJsonExport.reason
          : null

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    setRegenError(null)

    try {
      await createEpisodeFromChapter(scenario.id, chapter.id)
    } catch (error) {
      setRegenError(error instanceof Error ? error.message : 'Failed to regenerate chapter')
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleDeleteEpisode = async () => {
    setIsDeleting(true)
    setRegenError(null)

    try {
      await deleteEpisodeFromChapter(scenario.id, chapter.id)
    } catch (error) {
      setRegenError(error instanceof Error ? error.message : 'Failed to delete episode')
    } finally {
      setIsDeleting(false)
    }
  }

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
              <h1 className="mt-1 text-2xl font-bold tracking-tight">{chapter.title}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">{scenario.title} の章詳細とセリフを確認できます</p>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
                <span>{chapter.cueCount} cues</span>
                <span className="hidden text-border sm:inline">|</span>
                <span>約{chapter.durationMinutes}分</span>
                <span className="hidden text-border sm:inline">|</span>
                <div className="flex items-center gap-1.5">
                  {chapter.characters.map((character) => (
                    <CharacterAvatar key={character.speakerId ?? character.name} character={character} size="sm" />
                  ))}
                  <span className="ml-1">{chapter.characters.length}人</span>
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
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 text-xs sm:w-auto"
                  onClick={() => void handleRegenerate()}
                  disabled={isRegenerating}
                >
                  {isRegenerating ? (
                    <>
                      <Loader2 className="size-3 animate-spin" />
                      再生成中...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="size-3" />
                      この章を再生成
                    </>
                  )}
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
              {canDeleteEpisode ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 text-xs sm:w-auto"
                  onClick={() => void handleDeleteEpisode()}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="size-3 animate-spin" />
                      削除中...
                    </>
                  ) : (
                    <>
                      <Trash2 className="size-3" />
                      エピソード削除
                    </>
                  )}
                </Button>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs sm:w-auto" disabled>
                        <Trash2 className="size-3" />
                        エピソード削除
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{deleteHint}</TooltipContent>
                </Tooltip>
              )}
              {chapterVdsPreviewReason === null ? (
                <VdsPreviewDialog
                  title={`第${chapter.number}章のVDS出力を確認`}
                  description="この章の VDS / VDS JSON を確認してから出力できます。"
                  vdsExport={chapterVdsExport}
                  vdsJsonExport={chapterVdsJsonExport}
                  triggerClassName="w-full gap-1.5 text-xs sm:w-auto"
                  triggerLabel="VDSビュー"
                  triggerSize="sm"
                />
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button size="sm" className="w-full gap-1.5 text-xs sm:w-auto" disabled>
                        VDSビュー
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{chapterVdsPreviewReason}</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
          {regenError && <p className="mt-3 text-sm text-destructive">{regenError}</p>}
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
              const speaker = scenario.speakers.find((s) => s.speakerId === cue.speaker)
              const character = chapter.characters.find(
                (item) => item.speakerId !== null && item.speakerId === speaker?.speakerId
              )
              return <SpeechCueCard key={key} cue={cue} speaker={speaker} character={character} />
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

export const ChapterDetailPage = () => (
  <PageSuspense label="シナリオを読み込み中です">
    <ChapterDetailPageContent />
  </PageSuspense>
)

export const Route = createFileRoute('/scenarios/$id/chapters/$chapterId')({
  component: ChapterDetailPage
})
