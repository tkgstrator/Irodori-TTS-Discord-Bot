import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Check, ChevronLeft, Eye, Loader2, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useLlmSettings } from '@/components/llm-settings-provider'
import { PageSuspense } from '@/components/page-suspense'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { getAgeGroupLabel, getGenderLabel, getOccupationLabel } from '@/lib/character-options'
import { useSuspenseCharacters } from '@/lib/characters'
import { useScenarioMutations } from '@/lib/scenarios'
import { cn } from '@/lib/utils'
import { type GeminiModel, geminiModelCatalog } from '@/schemas/llm-settings.dto'
import {
  ScenarioCreateFormSchema,
  type ScenarioCreateFormValues,
  ScenarioGenreValues,
  ScenarioToneValues,
  scenarioCharacterLimit
} from '@/schemas/scenario.dto'
import { type ScenarioGenerateRequest, ScenarioGenerateRequestSchema } from '@/schemas/scenario-generate-request.dto'

const defaultValues: ScenarioCreateFormValues = {
  title: '',
  genres: [],
  tone: 'ほろ苦い',
  editorModel: 'gemini-2.5-flash',
  writerModel: 'gemini-2.5-flash',
  plotCharacterIds: [],
  promptNote: ''
}

// 配列の選択状態を切り替える
export const toggleValue = (values: readonly string[], value: string, max: number) => {
  if (values.includes(value)) {
    return values.filter((item) => item !== value)
  }

  if (values.length >= max) {
    return [...values]
  }

  return [...values, value]
}

// 補助文とエラー文をまとめて表示する
export const FieldHint = ({ error, hint }: { error?: string; hint?: string }) => {
  if (!error && !hint) {
    return null
  }

  return <p className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}>{error ?? hint}</p>
}

// キャラクターの基本設定を一覧向けの文言へ整える
export const characterBaseSummary = ({
  ageGroup,
  gender,
  occupation
}: {
  ageGroup: string
  gender: string
  occupation: string
}) => [getAgeGroupLabel(ageGroup), getGenderLabel(gender), getOccupationLabel(occupation)].join(' ・ ')

// モデル名から表示ラベルを引く
const getGeminiModelLabel = (model: GeminiModel) => {
  return geminiModelCatalog.find((item) => item.value === model)?.label ?? model
}

// キャラクターアイコンを画像またはイニシャルで表示する
export const CharacterAvatar = ({
  imageUrl,
  name,
  className,
  textClassName
}: {
  imageUrl: string | null
  name: string
  className: string
  textClassName: string
}) => {
  if (imageUrl) {
    return (
      <img src={imageUrl} alt="" className={cn('shrink-0 rounded-full border border-border object-cover', className)} />
    )
  }

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border border-border bg-secondary font-semibold text-secondary-foreground',
        className,
        textClassName
      )}
    >
      {name.slice(0, 1)}
    </span>
  )
}

// ジャンル選択用のチップボタンを描画する
export const GenreChip = ({
  active,
  disabled,
  label,
  onClick
}: {
  active: boolean
  disabled: boolean
  label: string
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-pressed={active}
    className={cn(
      'inline-flex items-center justify-center rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
      active && 'border-primary bg-primary text-primary-foreground',
      !active && 'border-border bg-background text-foreground hover:bg-muted',
      disabled && !active && 'cursor-not-allowed opacity-50'
    )}
  >
    {label}
  </button>
)

// キャラクター選択グリッド項目を描画する
export const CharacterCard = ({
  active,
  summary,
  imageUrl,
  disabled,
  name,
  onClick
}: {
  active: boolean
  summary: string
  imageUrl: string | null
  disabled: boolean
  name: string
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-pressed={active}
    className={cn(
      'flex h-full w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors',
      active && 'border-primary bg-primary/5',
      !active && 'border-border hover:bg-muted/40',
      disabled && !active && 'cursor-not-allowed opacity-50'
    )}
  >
    <CharacterAvatar imageUrl={imageUrl} name={name} className="size-10" textClassName="text-sm" />
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-3">
        <span className="line-clamp-1 text-sm font-semibold text-foreground">{name}</span>
        {active && <Check className="size-4 text-primary" aria-hidden="true" />}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{summary}</p>
    </div>
  </button>
)

const ScenarioNewPageContent = () => {
  const navigate = useNavigate()
  const { addScenario } = useScenarioMutations()
  const { characters } = useSuspenseCharacters()
  const { llmSettings } = useLlmSettings()
  const pagePaddingCls = 'sm:px-6 sm:pb-8'
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewRequest, setPreviewRequest] = useState<ScenarioGenerateRequest | null>(null)
  const formDefaults = useMemo(
    () => ({
      ...defaultValues,
      editorModel: llmSettings.editor,
      writerModel: llmSettings.writer
    }),
    [llmSettings.editor, llmSettings.writer]
  )

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    watch
  } = useForm<ScenarioCreateFormValues>({
    resolver: zodResolver(ScenarioCreateFormSchema),
    defaultValues: formDefaults
  })

  const selectedGenres = watch('genres')
  const selectedCharacterIds = watch('plotCharacterIds')
  const title = watch('title')
  const tone = watch('tone')
  const promptNote = watch('promptNote')
  const editorModel = watch('editorModel')
  const writerModel = watch('writerModel')

  const selectedCharacters = useMemo(
    () => characters.filter((character) => selectedCharacterIds.includes(character.id)),
    [characters, selectedCharacterIds]
  )
  const previewJson = useMemo(
    () => (previewRequest ? `${JSON.stringify(previewRequest, null, 2)}\n` : ''),
    [previewRequest]
  )

  // 現在のフォーム入力から LLM 送信用 JSON を組み立てる
  const buildPreviewRequest = (values: ScenarioCreateFormValues) => {
    const requestResult = ScenarioGenerateRequestSchema.safeParse({
      model: {
        editor: values.editorModel,
        writer: values.writerModel
      },
      plot: {
        title: values.title.trim(),
        genres: values.genres,
        tone: values.tone,
        promptNote: values.promptNote
      },
      characters: characters
        .filter((character) => values.plotCharacterIds.includes(character.id))
        .map((character) => ({
          id: character.id,
          name: character.name,
          ageGroup: character.ageGroup,
          gender: character.gender,
          occupation: character.occupation,
          personalityTags: character.personalityTags,
          speechStyle: character.speechStyle,
          firstPerson: character.firstPerson,
          secondPerson: character.secondPerson,
          honorific: character.honorific,
          attributeTags: character.attributeTags,
          backgroundTags: character.backgroundTags,
          memo: character.memo,
          speakerId: character.speakerId,
          caption: character.caption
        }))
    })

    if (!requestResult.success) {
      throw new Error('Invalid scenario generate request')
    }

    return requestResult.data
  }

  // フォーム入力を検証したうえで JSON プレビューを表示する
  const handleOpenPreview = handleSubmit((values) => {
    const result = ScenarioCreateFormSchema.safeParse(values)

    if (!result.success) {
      throw new Error('Invalid scenario form data')
    }

    setPreviewRequest(buildPreviewRequest(result.data))
    setIsPreviewOpen(true)
  })

  // プレビュー済みの JSON を確認後に生成処理を進める
  const handleGenerate = async () => {
    if (!previewRequest) {
      return
    }

    setIsGenerating(true)

    try {
      await addScenario({
        title: previewRequest.plot.title,
        genres: previewRequest.plot.genres,
        tone: previewRequest.plot.tone,
        promptNote: previewRequest.plot.promptNote,
        editorModel: previewRequest.model.editor,
        writerModel: previewRequest.model.writer,
        characterIds: previewRequest.characters.map((character) => character.id)
      })

      setIsPreviewOpen(false)
      await navigate({ to: '/plots' })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className={pagePaddingCls}>
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="gap-3 sm:max-w-4xl" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>LLM に送信する JSON を確認</DialogTitle>
            <DialogDescription>
              この内容を確認したあとでのみ生成を実行できます。フォームを修正したい場合は閉じて戻ってください。
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-border bg-muted/30">
            <pre className="max-h-[60vh] overflow-auto p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all">
              {previewJson}
            </pre>
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <p className="text-xs text-muted-foreground">選択中のモデル設定とキャラクター情報を含めた送信内容です。</p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => setIsPreviewOpen(false)} disabled={isGenerating}>
                閉じる
              </Button>
              <Button type="button" onClick={() => void handleGenerate()} disabled={isGenerating || !previewRequest}>
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  '生成する'
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="sticky top-0 z-10 -mx-6 bg-background/95 px-6 pb-5 backdrop-blur-sm">
        <div className="w-full">
          <Link
            to="/plots"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-3.5" />
            プロット管理に戻る
          </Link>

          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">新規プロット作成</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                タイトル、ジャンル、登場キャラクターを整理して、生成前の下書きを作成します。
              </p>
            </div>
          </div>
        </div>
      </div>

      <form className="space-y-8 pt-4">
        <div className="grid gap-x-10 gap-y-8 xl:grid-cols-2">
          <section className="space-y-5 border-b border-border pb-8 xl:row-span-2">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">基本設定</h2>
              <p className="text-sm text-muted-foreground">一覧で識別しやすいタイトルと生成の方向性を決めます。</p>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(12rem,0.8fr)]">
              <div className="space-y-2">
                <Label htmlFor="title">タイトル</Label>
                <Input
                  id="title"
                  placeholder="例: 夏の約束"
                  className="h-11"
                  aria-invalid={errors.title ? 'true' : 'false'}
                  {...register('title')}
                />
                <FieldHint error={errors.title?.message} hint="60文字以内で入力してください" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">トーン</Label>
                <Controller
                  control={control}
                  name="tone"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="tone"
                        className="!h-11 w-full !py-1 !text-base md:!text-sm"
                        aria-invalid={errors.tone ? 'true' : 'false'}
                      >
                        <SelectValue placeholder="トーンを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {ScenarioToneValues.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldHint error={errors.tone?.message} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="promptNote">補足メモ</Label>
              <Textarea
                id="promptNote"
                rows={5}
                placeholder="季節や舞台、入れたい雰囲気などを自由にメモできます"
                className="min-h-32"
                aria-invalid={errors.promptNote ? 'true' : 'false'}
                {...register('promptNote')}
              />
              <div className="flex items-center justify-between gap-3">
                <FieldHint error={errors.promptNote?.message} hint="任意入力です。未入力でも下書き作成できます。" />
                <span className="shrink-0 text-xs text-muted-foreground">{promptNote.length}/400</span>
              </div>
            </div>
          </section>

          <section className="space-y-5 border-b border-border pb-8">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">ジャンル</h2>
              <p className="text-sm text-muted-foreground">
                1〜3個まで選択できます。複数選択で世界観の方向性を絞れます。
              </p>
            </div>

            <Controller
              control={control}
              name="genres"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2.5">
                  {ScenarioGenreValues.map((item) => {
                    const active = field.value.includes(item)
                    const disabled = !active && field.value.length >= 3

                    return (
                      <GenreChip
                        key={item}
                        active={active}
                        disabled={disabled}
                        label={item}
                        onClick={() => field.onChange(toggleValue(field.value, item, 3))}
                      />
                    )
                  })}
                </div>
              )}
            />

            <div className="flex items-center justify-between gap-3">
              <FieldHint error={errors.genres?.message} hint="選択したジャンルは一覧カードにバッジ表示されます。" />
              <span className="shrink-0 text-xs text-muted-foreground">{selectedGenres.length}/3</span>
            </div>
          </section>

          <section className="space-y-5 border-b border-border pb-8">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">生成モデル</h2>
              <p className="text-sm text-muted-foreground">
                Editor と Writer のモデルをここで指定できます。初期値には保存済みの設定を反映します。
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="editorModel">Editor</Label>
                  <span className="text-xs text-muted-foreground">{getGeminiModelLabel(editorModel)}</span>
                </div>
                <Controller
                  control={control}
                  name="editorModel"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="editorModel" className="!h-11 w-full !py-1 !text-base md:!text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {geminiModelCatalog.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <p className="text-xs text-muted-foreground">構成整理や整合性確認に使うモデルです。</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="writerModel">Writer</Label>
                  <span className="text-xs text-muted-foreground">{getGeminiModelLabel(writerModel)}</span>
                </div>
                <Controller
                  control={control}
                  name="writerModel"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="writerModel" className="!h-11 w-full !py-1 !text-base md:!text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {geminiModelCatalog.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <p className="text-xs text-muted-foreground">本文やセリフ生成に使うモデルです。</p>
              </div>
            </div>
          </section>

          <section className="space-y-5 border-b border-border pb-8 xl:col-span-2">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">登場キャラクター</h2>
              <p className="text-sm text-muted-foreground">
                最大{scenarioCharacterLimit}人まで選択できます。未選択でも下書きだけ先に作成できます。
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>選択すると一覧カードの「プロット元」と話者数に反映されます。</span>
              <span>
                {selectedCharacterIds.length}/{scenarioCharacterLimit}
              </span>
            </div>

            {characters.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-5">
                <p className="text-sm text-muted-foreground">
                  キャラクターが未登録のため、先にキャラクター作成が必要です。
                </p>
                <Button asChild variant="outline" size="lg" className="mt-4 h-11">
                  <Link to="/characters/new">キャラクターを追加</Link>
                </Button>
              </div>
            ) : (
              <Controller
                control={control}
                name="plotCharacterIds"
                render={({ field }) => (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {characters.map((character) => {
                      const active = field.value.includes(character.id)
                      const disabled = !active && field.value.length >= scenarioCharacterLimit
                      const summary = characterBaseSummary(character)

                      return (
                        <CharacterCard
                          key={character.id}
                          active={active}
                          summary={summary}
                          imageUrl={character.imageUrl}
                          disabled={disabled}
                          name={character.name}
                          onClick={() => field.onChange(toggleValue(field.value, character.id, scenarioCharacterLimit))}
                        />
                      )
                    })}
                  </div>
                )}
              />
            )}

            <FieldHint error={errors.plotCharacterIds?.message} />
          </section>

          <section className="space-y-5 border-b border-border pb-8">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">作成内容の確認</h2>
              <p className="text-sm text-muted-foreground">保存前に一覧へ反映される要約を確認できます。</p>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium tracking-wide text-muted-foreground">タイトル</p>
              <p className="text-sm font-semibold text-foreground">{title.trim() || '未入力'}</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium tracking-wide text-muted-foreground">ジャンル</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedGenres.length > 0 ? (
                  selectedGenres.map((item) => (
                    <span
                      key={item}
                      className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                    >
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">未選択</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium tracking-wide text-muted-foreground">トーン</p>
              <p className="text-sm text-foreground">{tone}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <p className="text-xs font-medium tracking-wide text-muted-foreground">Editor</p>
                <p className="text-sm text-foreground">{getGeminiModelLabel(editorModel)}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium tracking-wide text-muted-foreground">Writer</p>
                <p className="text-sm text-foreground">{getGeminiModelLabel(writerModel)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium tracking-wide text-muted-foreground">補足メモ</p>
              <p className="text-sm text-foreground">{promptNote.trim() || '未入力'}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground">
                <Users className="size-3.5" aria-hidden="true" />
                選択中のキャラクター
              </div>
              {selectedCharacters.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedCharacters.map((character) => (
                    <span
                      key={character.id}
                      className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm"
                    >
                      <CharacterAvatar
                        imageUrl={character.imageUrl}
                        name={character.name}
                        className="size-8"
                        textClassName="text-xs"
                      />
                      <span className="line-clamp-1 text-foreground">{character.name}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">未選択</p>
              )}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-3 pb-2 sm:flex-row">
          <Button
            type="button"
            size="lg"
            className="h-11 sm:min-w-48"
            disabled={isSubmitting || isGenerating}
            onClick={() => void handleOpenPreview()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                Preparing JSON...
              </>
            ) : (
              <>
                <Eye />
                送信JSONを確認
              </>
            )}
          </Button>
          <Button type="button" asChild variant="outline" size="lg" className="h-11 sm:min-w-40">
            <Link to="/plots">キャンセル</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}

export const ScenarioNewPage = () => (
  <PageSuspense label="キャラクターを読み込み中です">
    <ScenarioNewPageContent />
  </PageSuspense>
)

export const Route = createFileRoute('/scenarios/new')({
  component: ScenarioNewPage
})
