import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute, Link, useNavigate, useParams } from '@tanstack/react-router'
import { ChevronLeft, Loader2, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { PageSuspense } from '@/components/page-suspense'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSuspenseCharacters } from '@/lib/characters'
import { useScenarioMutations, useSuspenseResolvedScenarios } from '@/lib/scenarios'
import {
  ScenarioCreateFormSchema,
  type ScenarioCreateFormValues,
  ScenarioGenreValues,
  ScenarioToneValues,
  scenarioCharacterLimit
} from '@/schemas/scenario.dto'
import { CharacterAvatar, CharacterCard, characterBaseSummary, FieldHint, GenreChip, toggleValue } from './new'

// 編集フォームの初期値を現在のプロット情報から組み立てる。
const createScenarioEditDefaults = ({
  characterIds,
  genres,
  title,
  tone
}: {
  characterIds: readonly string[]
  genres: readonly string[]
  title: string
  tone: ScenarioCreateFormValues['tone']
}): ScenarioCreateFormValues => ({
  title,
  genres: [...genres],
  tone,
  plotCharacterIds: [...characterIds],
  promptNote: ''
})

const ScenarioEditPageContent = () => {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const { characters } = useSuspenseCharacters()
  const { getScenario, scenarios } = useSuspenseResolvedScenarios(characters)
  const { updateScenario } = useScenarioMutations({ scenarios })
  const scenario = getScenario(id)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const pagePaddingCls = 'sm:px-6 sm:pb-8'
  const selectedScenarioCharacterIds = useMemo(() => {
    if (!scenario) {
      return []
    }

    const characterIdByName = new Map(characters.map((character) => [character.name, character.id] as const))
    return scenario.plotCharacters.flatMap((name) => {
      const characterId = characterIdByName.get(name)
      return characterId ? [characterId] : []
    })
  }, [characters, scenario])
  const editDefaults = useMemo(
    () =>
      createScenarioEditDefaults({
        characterIds: selectedScenarioCharacterIds,
        genres: scenario?.genres ?? [],
        title: scenario?.title ?? '',
        tone: scenario?.tone ?? 'ほろ苦い'
      }),
    [scenario, selectedScenarioCharacterIds]
  )
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    watch
  } = useForm<ScenarioCreateFormValues>({
    resolver: zodResolver(ScenarioCreateFormSchema),
    defaultValues: editDefaults
  })

  useEffect(() => {
    reset(editDefaults)
  }, [editDefaults, reset])

  const selectedGenres = watch('genres')
  const selectedCharacterIds = watch('plotCharacterIds')
  const title = watch('title')
  const tone = watch('tone')
  const selectedCharacters = useMemo(
    () => characters.filter((character) => selectedCharacterIds.includes(character.id)),
    [characters, selectedCharacterIds]
  )

  if (!scenario) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">プロットが見つかりません</p>
      </div>
    )
  }

  const hasCreatedChapters = scenario.chapters.length > 0

  // 入力済みの内容を検証してプロット更新を実行する。
  const handleSave = handleSubmit(async (values) => {
    const result = ScenarioCreateFormSchema.safeParse(values)

    if (!result.success) {
      throw new Error('Invalid scenario edit form data')
    }

    setSubmitError(null)

    try {
      await updateScenario(scenario.id, {
        title: result.data.title,
        genres: result.data.genres,
        tone: result.data.tone,
        characterIds: result.data.plotCharacterIds
      })
      await navigate({ to: '/plots/$id', params: { id: scenario.id } })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to update plot')
    }
  })

  return (
    <div className={pagePaddingCls}>
      <div className="sticky top-0 z-10 -mx-6 bg-background/95 px-6 pb-5 backdrop-blur-sm">
        <div className="w-full">
          <Link
            to="/plots/$id"
            params={{ id: scenario.id }}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-3.5" />
            詳細に戻る
          </Link>

          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">プロット編集</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                タイトル、ジャンル、トーンを更新できます。章がある場合は登場キャラクターを固定します。
              </p>
            </div>
          </div>
        </div>
      </div>

      <form className="space-y-8 pt-4">
        <div className="grid gap-x-10 gap-y-8 xl:grid-cols-2">
          <section className="space-y-5 border-b border-border pb-8">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">基本設定</h2>
              <p className="text-sm text-muted-foreground">詳細ページに表示される基本情報を更新します。</p>
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
          </section>

          <section className="space-y-5 border-b border-border pb-8">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">ジャンル</h2>
              <p className="text-sm text-muted-foreground">
                1〜3個まで選択できます。詳細と一覧の見え方に反映されます。
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
              <FieldHint error={errors.genres?.message} hint="選択したジャンルはバッジ表示されます。" />
              <span className="shrink-0 text-xs text-muted-foreground">{selectedGenres.length}/3</span>
            </div>
          </section>

          <section className="space-y-5 border-b border-border pb-8 xl:col-span-2">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">登場キャラクター</h2>
              <p className="text-sm text-muted-foreground">
                最大{scenarioCharacterLimit}人まで選択できます。章作成後は既存キャラクターを残したまま追加のみできます。
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>
                {hasCreatedChapters
                  ? '章を作成済みのため既存キャラクターは固定され、新規追加のみ可能です。'
                  : '選択内容は一覧カードと詳細ヘッダーに反映されます。'}
              </span>
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
                      const isExistingCharacter = selectedScenarioCharacterIds.includes(character.id)
                      const disabled =
                        (hasCreatedChapters && active && isExistingCharacter) ||
                        (!active && field.value.length >= scenarioCharacterLimit)
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

          <section className="space-y-5 border-b border-border pb-8 xl:col-span-2">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">更新内容の確認</h2>
              <p className="text-sm text-muted-foreground">保存前に反映内容を確認できます。</p>
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
                      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm"
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

        {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

        <div className="flex flex-col gap-3 pb-2 sm:flex-row">
          <Button
            type="button"
            size="lg"
            className="h-11 sm:min-w-48"
            disabled={isSubmitting}
            onClick={() => void handleSave()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                Updating...
              </>
            ) : (
              '更新する'
            )}
          </Button>
          <Button type="button" asChild variant="outline" size="lg" className="h-11 sm:min-w-40">
            <Link to="/plots/$id" params={{ id: scenario.id }}>
              キャンセル
            </Link>
          </Button>
        </div>
      </form>
    </div>
  )
}

export const ScenarioEditPage = () => (
  <PageSuspense label="プロットを読み込み中です">
    <ScenarioEditPageContent />
  </PageSuspense>
)

export const Route = createFileRoute('/scenarios/$id/edit')({
  component: ScenarioEditPage
})
