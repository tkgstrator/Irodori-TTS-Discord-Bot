import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, Outlet, useLocation, useMatches, useNavigate, useParams } from '@tanstack/react-router'
import {
  Check,
  ChevronLeft,
  Clock,
  Loader2,
  MessageSquare,
  Pencil,
  Play,
  RefreshCw,
  Sparkles,
  Users
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { PageSuspense } from '@/components/page-suspense'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { VdsPreviewDialog } from '@/components/vds-preview-dialog'
import { buildChapterPlanRequest, requestChapterPlan } from '@/lib/chapter-plan'
import { charactersQueryOptions } from '@/lib/characters'
import type { Chapter, ChapterCharacter, ChapterStatus, Scenario } from '@/lib/scenarios'
import {
  canGenerateNextChapter,
  canRegenerateChapter,
  useScenarioMutations,
  useSuspenseResolvedScenario
} from '@/lib/scenarios'
import { cn } from '@/lib/utils'
import { createScenarioVdsExport, createScenarioVdsJsonExport } from '@/lib/vds'
import type { ChapterGenerateMode } from '@/schemas/chapter-generate-request.dto'
import { ChapterGenerateFormSchema, type ChapterGenerateFormValues } from '@/schemas/chapter-generation.dto'
import type { GeminiModel } from '@/schemas/llm-settings.dto'

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

const emptyCharacterNames: readonly string[] = []

const characterAvatar = ({ character, dimmed }: { character: ChapterCharacter; dimmed?: boolean }) => {
  const initial = character.name.charAt(0) || '?'

  return (
    <Avatar className={`size-6 ${dimmed ? 'opacity-50' : ''}`} title={character.name}>
      <AvatarImage src={character.imageUrl ?? undefined} alt="" />
      <AvatarFallback>{initial}</AvatarFallback>
    </Avatar>
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

  if (status === 'failed') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-1.5 py-0.5 text-xs font-medium text-destructive">
        <RefreshCw className="size-2.5" />
        失敗
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
  if (status === 'failed') return 'bg-destructive border-destructive'
  return 'border-border bg-background'
}

const chapterRowCls = (status: ChapterStatus): string => {
  if (status === 'generating') return 'border-amber-200/80'
  if (status === 'failed') return 'border-destructive/40'
  if (status === 'draft') return 'border-border/70 opacity-80'
  return 'border-border'
}

// 章生成ダイアログで使う初期値を組み立てる。
const createChapterGenerateDefaults = (characterNames: readonly string[]): ChapterGenerateFormValues => ({
  title: '',
  promptNote: '',
  characterNames: [...characterNames]
})

// 選択中の登場人物を切り替える。
const toggleCharacterName = (names: readonly string[], value: string): string[] =>
  names.includes(value) ? names.filter((name) => name !== value) : [...names, value]

// 章生成ダイアログ内の人物選択チップを描画する。
const CharacterSelectChip = ({
  active,
  disabled,
  label,
  onClick
}: {
  active: boolean
  disabled?: boolean
  label: string
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'inline-flex min-h-8 items-center rounded-full border px-3 text-xs transition-colors',
      active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:bg-muted',
      disabled && 'pointer-events-none opacity-50'
    )}
  >
    {label}
  </button>
)

// 後続章がある場合の再生成不可理由を返す。
const getChapterRegenHint = ({ chapter, scenario }: { chapter: Chapter; scenario: Scenario }): string | null => {
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
  isPlotsRoute,
  isEpisodeCreating,
  onCreateEpisode
}: {
  chapter: Chapter
  scenario: Scenario
  isPlotsRoute: boolean
  isEpisodeCreating: boolean
  onCreateEpisode: (chapterId: string) => Promise<void>
}) => {
  const isDraft = chapter.status === 'draft'
  const isCompleted = chapter.status === 'completed'
  const isFailed = chapter.status === 'failed'
  const regenHint = getChapterRegenHint({
    chapter: isFailed
      ? {
          ...chapter,
          status: 'completed'
        }
      : chapter,
    scenario
  })
  const isRegenDisabled = regenHint !== null
  const hasReadableEpisode = isCompleted || (isFailed && chapter.cues.length > 0)
  const chapterDetailLink = isPlotsRoute ? '/plots/$id/chapters/$chapterId' : '/scenarios/$id/chapters/$chapterId'

  return (
    <div className="relative flex gap-3 sm:gap-5">
      <div className="flex w-4 shrink-0 flex-col items-center sm:w-8">
        <div
          className={cn(
            'mt-4 h-6 w-1.5 shrink-0 rounded-full sm:hidden',
            chapter.status === 'completed' && 'bg-primary',
            chapter.status === 'generating' && 'animate-pulse bg-amber-400',
            chapter.status === 'failed' && 'bg-destructive',
            chapter.status === 'draft' && 'bg-border'
          )}
        />
        <div
          className={`mt-5 hidden size-4 shrink-0 rounded-full border-2 sm:block ${timelineNodeCls(chapter.status)}`}
        />
        <div className="w-px flex-1 bg-border" />
      </div>
      <div className={`flex-1 ${chapterRowCls(chapter.status)}`}>
        <div className="flex flex-col gap-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">第{chapter.number}章</span>
              {hasReadableEpisode ? (
                <Link
                  to={chapterDetailLink}
                  params={{ id: scenario.id, chapterId: chapter.id }}
                  className="text-sm font-semibold transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {chapter.title}
                </Link>
              ) : (
                <span className={`text-sm font-semibold ${isDraft ? 'text-muted-foreground' : ''}`}>
                  {chapter.title}
                </span>
              )}
              {chapterStatusBadge({ status: chapter.status })}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{chapter.cueCount} cues</span>
              <span>·</span>
              <span>約{chapter.durationMinutes}分</span>
            </div>
            <p className={`text-sm ${isDraft ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
              {chapter.synopsis}
            </p>
            {chapter.generationError && <p className="text-xs text-destructive">{chapter.generationError}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
              {chapter.characters.map((character) => (
                <span key={character.speakerId ?? character.name}>
                  {characterAvatar({ character, dimmed: isDraft })}
                </span>
              ))}
            </div>
            <div className="relative z-20 flex w-full flex-wrap items-center gap-1.5 sm:w-auto sm:justify-end">
              {(chapter.status === 'completed' || chapter.status === 'failed') &&
                (isRegenDisabled ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground"
                          aria-label="再生成不可"
                          disabled
                        >
                          <RefreshCw className="size-3.5" />
                          {chapter.status === 'failed' ? '再試行' : '再生成'}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{regenHint}</TooltipContent>
                  </Tooltip>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground"
                    aria-label="再生成"
                    onClick={() => void onCreateEpisode(chapter.id)}
                    disabled={isEpisodeCreating}
                  >
                    {isEpisodeCreating ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        {chapter.status === 'failed' ? '再試行中...' : '再生成中...'}
                      </>
                    ) : (
                      <>
                        <RefreshCw className="size-3.5" />
                        {chapter.status === 'failed' ? '再試行' : '再生成'}
                      </>
                    )}
                  </Button>
                ))}
              {hasReadableEpisode && (
                <Button
                  asChild
                  variant={isPlotsRoute ? 'outline' : 'ghost'}
                  size="sm"
                  className={cn('gap-1.5 text-xs text-muted-foreground', isPlotsRoute ? 'h-8 px-2.5' : 'h-7 px-2')}
                  aria-label="詳細"
                >
                  <Link to={chapterDetailLink} params={{ id: scenario.id, chapterId: chapter.id }}>
                    詳細
                  </Link>
                </Button>
              )}
              {chapter.status === 'generating' && (
                <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-medium text-amber-600 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-400">
                  <Loader2 className="size-3 animate-spin" />
                  処理中...
                </span>
              )}
              {chapter.status === 'draft' && (
                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => void onCreateEpisode(chapter.id)}
                  disabled={isEpisodeCreating}
                >
                  {isEpisodeCreating ? (
                    <>
                      <Loader2 className="size-3 animate-spin" />
                      作成中...
                    </>
                  ) : (
                    <>
                      <Play className="size-3" />
                      この章から作成
                    </>
                  )}
                </Button>
              )}
              {chapter.status === 'failed' && !hasReadableEpisode && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 px-2.5 text-xs text-destructive"
                  onClick={() => void onCreateEpisode(chapter.id)}
                  disabled={isEpisodeCreating}
                >
                  {isEpisodeCreating ? (
                    <>
                      <Loader2 className="size-3 animate-spin" />
                      再試行中...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="size-3" />
                      再試行
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const ScenarioDetailPageContent = () => {
  const { id } = useParams({ strict: false })
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const scenarioId = id ?? ''
  const queryClient = useQueryClient()
  const { scenario } = useSuspenseResolvedScenario(scenarioId)
  const scenarios = useMemo(() => (scenario ? [scenario] : []), [scenario])
  const { appendNextChapter, createEpisodeFromChapter } = useScenarioMutations({ scenarios })
  const [isChapterDialogOpen, setIsChapterDialogOpen] = useState(false)
  const [isChapterPlanning, setIsChapterPlanning] = useState(false)
  const [isChapterCreating, setIsChapterCreating] = useState(false)
  const [creatingChapterId, setCreatingChapterId] = useState<string | null>(null)
  const [chapterPlanError, setChapterPlanError] = useState<string | null>(null)
  const [regenDialog, setRegenDialog] = useState<{ chapterId: string | null; userDirection: string }>({
    chapterId: null,
    userDirection: ''
  })
  const matches = useMatches()
  const isPlotsRoute = pathname.startsWith('/plots')
  const hasChildRoute = matches.some(
    (match) =>
      match.routeId === '/scenarios/$id/chapters/$chapterId' ||
      match.routeId === '/plots/$id/chapters/$chapterId' ||
      match.routeId === '/scenarios/$id/edit' ||
      match.routeId === '/plots/$id/edit'
  )
  const plotCharacterNames = scenario?.plotCharacters ?? emptyCharacterNames
  const dialogDefaults = useMemo(() => createChapterGenerateDefaults(plotCharacterNames), [plotCharacterNames])
  const {
    control,
    handleSubmit,
    formState: { errors },
    register,
    reset,
    setValue,
    watch
  } = useForm<ChapterGenerateFormValues>({
    resolver: zodResolver(ChapterGenerateFormSchema),
    defaultValues: dialogDefaults
  })

  useEffect(() => {
    reset(dialogDefaults)
  }, [dialogDefaults, reset])

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
  const latestChapterNumber =
    createdChapters.length > 0 ? Math.max(...createdChapters.map((chapter) => chapter.number)) : 0
  const characterNames = scenario.plotCharacters.join('・')
  const nextChapterNumber = latestChapterNumber + 1
  const latestChapter = scenario.chapters[scenario.chapters.length - 1]
  const canAppendChapter = canGenerateNextChapter(scenario.chapters)
  const hasCharacterChoices = scenario.plotCharacters.length > 0
  const nextChapterHint = canAppendChapter
    ? null
    : latestChapter?.status === 'draft'
      ? '未生成のエピソードがあるため、先にその章を生成してください'
      : latestChapter?.status === 'failed'
        ? '失敗した章を再試行するか削除してから次の章を作成してください'
        : '生成中の章が完了するまで次の章は作成できません'
  const scenarioVdsExport = createScenarioVdsExport(scenario)
  const scenarioVdsJsonExport = createScenarioVdsJsonExport(scenario)
  const scenarioVdsPreviewReason =
    !scenarioVdsExport.ok && !scenarioVdsJsonExport.ok
      ? scenarioVdsExport.reason
      : !scenarioVdsExport.ok
        ? scenarioVdsExport.reason
        : !scenarioVdsJsonExport.ok
          ? scenarioVdsJsonExport.reason
          : null
  const pagePaddingCls = isPlotsRoute ? 'sm:px-6 sm:pb-8' : 'sm:px-6 sm:py-8'
  const headerWidthCls = isPlotsRoute ? '' : 'max-w-3xl'
  const selectedCharacterNames = watch('characterNames')
  const chapterTitle = watch('title')
  const promptNote = watch('promptNote')
  const canCreateChapter = chapterTitle.trim().length > 0 && promptNote.trim().length > 0

  const handleCreateEpisode = async (chapterId: string, userDirection?: string) => {
    setCreatingChapterId(chapterId)
    setChapterPlanError(null)

    try {
      const nextScenario = await createEpisodeFromChapter(scenario.id, chapterId, userDirection)
      const nextChapter = nextScenario.chapters.find((chapter) => chapter.id === chapterId)

      if (!nextChapter) {
        throw new Error('Created episode was not found')
      }

      await navigate({
        to: isPlotsRoute ? '/plots/$id/chapters/$chapterId' : '/scenarios/$id/chapters/$chapterId',
        params: {
          id: scenario.id,
          chapterId: nextChapter.id
        }
      })
    } catch (error) {
      setChapterPlanError(error instanceof Error ? error.message : 'Failed to create episode')
    } finally {
      setCreatingChapterId(null)
    }
  }

  const handleOpenRegenDialog = async (chapterId: string) => {
    setRegenDialog({ chapterId, userDirection: '' })
  }

  const handleConfirmRegen = async () => {
    const { chapterId, userDirection } = regenDialog
    if (!chapterId) {
      return
    }
    setRegenDialog({ chapterId: null, userDirection: '' })
    await handleCreateEpisode(chapterId, userDirection.trim() || undefined)
  }

  // ダイアログ入力から章計画用の送信 JSON を組み立てる
  const buildPreviewChapterPlanRequest = async ({
    input,
    mode
  }: {
    input: ChapterGenerateFormValues
    mode: ChapterGenerateMode
  }) => {
    const characters = await queryClient.fetchQuery(charactersQueryOptions)
    return buildChapterPlanRequest({
      input,
      llmSettings: {
        editor: scenario.editorModel as GeminiModel,
        writer: scenario.writerModel as GeminiModel
      },
      mode,
      scenario,
      characters
    })
  }

  // おまかせで章タイトルと流れメモを自動入力する。
  const handleAutoFill = async () => {
    setIsChapterPlanning(true)
    setChapterPlanError(null)

    try {
      const request = await buildPreviewChapterPlanRequest({
        input: {
          title: '',
          promptNote: '',
          characterNames: selectedCharacterNames.length > 0 ? selectedCharacterNames : [...scenario.plotCharacters]
        },
        mode: 'auto'
      })
      const plan = await requestChapterPlan(request)

      setValue('title', plan.chapter.title, {
        shouldDirty: true,
        shouldValidate: true
      })
      setValue('promptNote', plan.chapter.summary, {
        shouldDirty: true,
        shouldValidate: true
      })
    } catch (error) {
      setChapterPlanError(error instanceof Error ? error.message : 'Failed to generate chapter plan')
    } finally {
      setIsChapterPlanning(false)
    }
  }

  // 入力済みの章タイトルと流れメモから下書き章を作成する。
  const handleCreateChapter = handleSubmit(async (values) => {
    setIsChapterCreating(true)
    setChapterPlanError(null)

    try {
      await appendNextChapter(scenario.id, values)
      setIsChapterDialogOpen(false)
      reset(createChapterGenerateDefaults(scenario.plotCharacters))
    } catch (error) {
      setChapterPlanError(error instanceof Error ? error.message : 'Failed to create chapter plot')
    } finally {
      setIsChapterCreating(false)
    }
  })

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

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight">{scenario.title}</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {isPlotsRoute ? '章ごとの進行と出力準備を確認できます' : '章ごとの生成状況と内容を確認できます'}
                </p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto md:shrink-0 md:pt-0.5">
                <Button asChild variant="outline" className="w-full gap-2 sm:w-auto">
                  <Link to={isPlotsRoute ? '/plots/$id/edit' : '/scenarios/$id/edit'} params={{ id: scenario.id }}>
                    <Pencil className="size-3.5" />
                    編集
                  </Link>
                </Button>
                {canAppendChapter && hasCharacterChoices ? (
                  <Button
                    variant="outline"
                    className="w-full gap-2 sm:w-auto"
                    onClick={() => setIsChapterDialogOpen(true)}
                  >
                    <Play className="size-3.5" />
                    作成
                  </Button>
                ) : !hasCharacterChoices ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button variant="outline" className="w-full gap-2 sm:w-auto" disabled>
                          <Play className="size-3.5" />
                          作成
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>登場人物が未設定のため、この操作は使えません</TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button variant="outline" className="w-full gap-2 sm:w-auto" disabled>
                          <Play className="size-3.5" />
                          作成
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{nextChapterHint}</TooltipContent>
                  </Tooltip>
                )}
                {scenarioVdsPreviewReason === null ? (
                  <VdsPreviewDialog
                    title="シナリオのVDS出力を確認"
                    description="シナリオ全体の VDS / VDS JSON を確認してから出力できます。"
                    vdsExport={scenarioVdsExport}
                    vdsJsonExport={scenarioVdsJsonExport}
                    triggerClassName="w-full gap-2 sm:w-auto"
                    triggerLabel="ダウンロード"
                  />
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button className="w-full gap-2 sm:w-auto" disabled>
                          ダウンロード
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{scenarioVdsPreviewReason}</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                {scenario.genres.map((genre) => (
                  <span
                    key={genre}
                    className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs ${GENRE_COLORS[genre] ?? 'bg-secondary text-secondary-foreground'}`}
                  >
                    {genre}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
                <span>
                  トーン: <span className="italic text-foreground">{scenario.tone}</span>
                </span>
                <span className="hidden text-border sm:inline">|</span>
                <span className="flex items-center gap-1">
                  <Users className="size-3" />
                  {scenario.plotCharacters.length}人 登場人物{' '}
                  <span className="font-medium text-foreground">{characterNames || '未設定'}</span>
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
          </div>
          <div className="mt-5 border-b border-border" />
        </div>
      </div>

      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="relative flex flex-col gap-8">
          {scenario.chapters.map((chapter) => (
            <ChapterCard
              key={chapter.id}
              chapter={chapter}
              scenario={scenario}
              isPlotsRoute={isPlotsRoute}
              isEpisodeCreating={creatingChapterId === chapter.id}
              onCreateEpisode={handleOpenRegenDialog}
            />
          ))}
        </div>

        {createdChapterCount > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-xl border border-border bg-card px-5 py-3 text-xs text-muted-foreground">
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
        )}
      </div>

      <Dialog open={isChapterDialogOpen} onOpenChange={setIsChapterDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{createdChapterCount === 0 ? '第1章を作成' : `第${nextChapterNumber}章を作成`}</DialogTitle>
            <DialogDescription>
              流れメモと登場人物を指定して章プロットを作成します。細かい指定が不要なら「おまかせ」を使ってください。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {chapterPlanError && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {chapterPlanError}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="chapter-title">章タイトル</Label>
              <Input
                id="chapter-title"
                placeholder={createdChapterCount === 0 ? '例: 出会い' : `例: 第${nextChapterNumber}章の見出し`}
                className="h-10"
                aria-invalid={errors.title ? 'true' : 'false'}
                {...register('title')}
              />
              <div className="flex items-center justify-between gap-3">
                <p className={cn('text-xs', errors.title ? 'text-destructive' : 'text-muted-foreground')}>
                  {errors.title?.message ?? '必須入力です。章の見出しとして表示されます。'}
                </p>
                <span className="shrink-0 text-xs text-muted-foreground">{chapterTitle.length}/60</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chapter-prompt-note">流れメモ</Label>
              <Textarea
                id="chapter-prompt-note"
                rows={5}
                placeholder="冒頭の雰囲気、入れたい出来事、会話の方向性など"
                className="min-h-32"
                aria-invalid={errors.promptNote ? 'true' : 'false'}
                {...register('promptNote')}
              />
              <div className="flex items-center justify-between gap-3">
                <p className={cn('text-xs', errors.promptNote ? 'text-destructive' : 'text-muted-foreground')}>
                  {errors.promptNote?.message ?? '必須入力です。章プロットの概要として保存されます。'}
                </p>
                <span className="shrink-0 text-xs text-muted-foreground">{promptNote.length}/400</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label>登場人物</Label>
                <span className="text-xs text-muted-foreground">
                  {selectedCharacterNames.length}/{scenario.plotCharacters.length}
                </span>
              </div>
              <Controller
                control={control}
                name="characterNames"
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2.5">
                    {scenario.plotCharacters.map((name) => (
                      <CharacterSelectChip
                        key={name}
                        active={field.value.includes(name)}
                        label={name}
                        onClick={() => field.onChange(toggleCharacterName(field.value, name))}
                      />
                    ))}
                  </div>
                )}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => void handleAutoFill()}
              disabled={isChapterPlanning || isChapterCreating}
            >
              {isChapterPlanning ? (
                <>
                  <Loader2 className="animate-spin" />
                  補完中...
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5" />
                  おまかせ入力
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsChapterDialogOpen(false)}
              disabled={isChapterPlanning || isChapterCreating}
            >
              キャンセル
            </Button>
            <Button
              onClick={() => void handleCreateChapter()}
              disabled={!canCreateChapter || isChapterPlanning || isChapterCreating}
            >
              {isChapterCreating ? (
                <>
                  <Loader2 className="animate-spin" />
                  作成中...
                </>
              ) : (
                <>
                  <Play className="size-3.5" />
                  作成
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={regenDialog.chapterId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRegenDialog({ chapterId: null, userDirection: '' })
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>エピソードを生成</DialogTitle>
            <DialogDescription>LLM への追加指示があれば入力してください（任意）</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="例: もっとコミカルな雰囲気にして"
            value={regenDialog.userDirection}
            onChange={(e) => setRegenDialog((prev) => ({ ...prev, userDirection: e.target.value }))}
            maxLength={500}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegenDialog({ chapterId: null, userDirection: '' })}>
              キャンセル
            </Button>
            <Button onClick={() => void handleConfirmRegen()}>
              <RefreshCw className="size-3" />
              生成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export const ScenarioDetailPage = () => (
  <PageSuspense label="シナリオを読み込み中です">
    <ScenarioDetailPageContent />
  </PageSuspense>
)

export const Route = createFileRoute('/scenarios/$id')({
  component: ScenarioDetailPage
})
