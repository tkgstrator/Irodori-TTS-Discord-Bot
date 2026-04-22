import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Check, ChevronLeft, Loader2, Sparkles, Users } from 'lucide-react'
import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCharacters } from '@/lib/characters'
import { useScenarios } from '@/lib/scenarios'
import { cn } from '@/lib/utils'
import {
  ScenarioCreateFormSchema,
  type ScenarioCreateFormValues,
  ScenarioGenreValues,
  ScenarioToneValues
} from '@/schemas/scenario.dto'

const defaultValues: ScenarioCreateFormValues = {
  title: '',
  genres: [],
  tone: 'ほろ苦い',
  plotCharacterIds: [],
  promptNote: ''
}

// 現在日付を一覧表示用の形式へ整える
const formatScenarioDate = () => new Date().toISOString().slice(0, 10)

// 配列の選択状態を切り替える
const toggleValue = (values: readonly string[], value: string, max: number) => {
  if (values.includes(value)) {
    return values.filter((item) => item !== value)
  }

  if (values.length >= max) {
    return [...values]
  }

  return [...values, value]
}

// 補助文とエラー文をまとめて表示する
const FieldHint = ({ error, hint }: { error?: string; hint?: string }) => {
  if (!error && !hint) {
    return null
  }

  return <p className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}>{error ?? hint}</p>
}

// ジャンル選択用のチップボタンを描画する
const GenreChip = ({
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
      'inline-flex min-h-11 items-center justify-center rounded-full border px-4 text-sm font-medium transition-colors',
      active && 'border-primary bg-primary text-primary-foreground',
      !active && 'border-border bg-background text-foreground hover:bg-muted',
      disabled && !active && 'cursor-not-allowed opacity-50'
    )}
  >
    {label}
  </button>
)

// キャラクター選択カードを描画する
const CharacterCard = ({
  active,
  disabled,
  hint,
  name,
  tags,
  onClick
}: {
  active: boolean
  disabled: boolean
  hint: string
  name: string
  tags: readonly string[]
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-pressed={active}
    className={cn(
      'flex min-h-28 w-full flex-col items-start gap-3 rounded-xl border p-4 text-left transition-colors',
      active && 'border-primary bg-primary/5 ring-2 ring-primary/20',
      !active && 'border-border bg-card hover:bg-muted/60',
      disabled && !active && 'cursor-not-allowed opacity-50'
    )}
  >
    <div className="flex w-full items-start gap-3">
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
        {name.slice(0, 1)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <span className="line-clamp-1 text-sm font-semibold text-foreground">{name}</span>
          {active && <Check className="size-4 text-primary" aria-hidden="true" />}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
    <div className="flex flex-wrap gap-1.5">
      {tags.slice(0, 3).map((tag) => (
        <span key={tag} className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
          {tag}
        </span>
      ))}
    </div>
  </button>
)

export const ScenarioNewPage = () => {
  const navigate = useNavigate()
  const { addScenario } = useScenarios()
  const { characters, isLoading, errorMessage } = useCharacters()

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    watch
  } = useForm<ScenarioCreateFormValues>({
    resolver: zodResolver(ScenarioCreateFormSchema),
    defaultValues
  })

  const selectedGenres = watch('genres')
  const selectedCharacterIds = watch('plotCharacterIds')
  const title = watch('title')
  const tone = watch('tone')
  const promptNote = watch('promptNote')

  const selectedCharacters = useMemo(
    () => characters.filter((character) => selectedCharacterIds.includes(character.id)),
    [characters, selectedCharacterIds]
  )

  const onSubmit = handleSubmit(async (values) => {
    const result = ScenarioCreateFormSchema.safeParse(values)

    if (!result.success) {
      throw new Error('Invalid scenario form data')
    }

    addScenario({
      title: result.data.title.trim(),
      status: 'draft',
      genres: result.data.genres,
      tone: result.data.tone,
      plotCharacters: selectedCharacters.map((character) => character.name),
      cueCount: 0,
      speakerCount: selectedCharacters.length,
      durationMinutes: null,
      isAiGenerated: false,
      updatedAt: formatScenarioDate(),
      speakers: [],
      chapters: []
    })

    await navigate({ to: '/plots' })
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8">
        <Button asChild variant="ghost" className="w-fit px-0 text-muted-foreground hover:text-foreground">
          <Link to="/plots">
            <ChevronLeft data-icon="inline-start" />
            プロット管理に戻る
          </Link>
        </Button>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">新規プロット作成</h1>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              タイトル、ジャンル、登場キャラクターを整理して、生成前の下書きを作成します。
            </p>
          </div>
          <div className="inline-flex min-h-11 items-center gap-2 self-start rounded-full border border-border bg-card px-4 text-sm text-muted-foreground">
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
            モバイル優先の入力フロー
          </div>
        </div>
      </div>

      <form className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]" onSubmit={onSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>基本設定</CardTitle>
              <CardDescription>一覧で識別しやすいタイトルと生成の方向性を決めます。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
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
                      <SelectTrigger id="tone" className="h-11 w-full" aria-invalid={errors.tone ? 'true' : 'false'}>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>ジャンル</CardTitle>
              <CardDescription>1〜3個まで選択できます。複数選択で世界観の方向性を絞れます。</CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
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
              <div className="mt-3 flex items-center justify-between gap-3">
                <FieldHint error={errors.genres?.message} hint="選択したジャンルは一覧カードにバッジ表示されます。" />
                <span className="shrink-0 text-xs text-muted-foreground">{selectedGenres.length}/3</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>登場キャラクター</CardTitle>
              <CardDescription>最大3人まで選択できます。未選択でも下書きだけ先に作成できます。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>選択すると一覧カードの「プロット元」と話者数に反映されます。</span>
                <span>{selectedCharacterIds.length}/3</span>
              </div>

              {isLoading ? (
                <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                  Loading characters...
                </div>
              ) : errorMessage ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  {errorMessage}
                </div>
              ) : characters.length === 0 ? (
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
                    <div className="grid gap-3 sm:grid-cols-2">
                      {characters.map((character) => {
                        const active = field.value.includes(character.id)
                        const disabled = !active && field.value.length >= 3
                        const hint = character.memo.trim() || 'キャラクター詳細メモは未設定です'

                        return (
                          <CharacterCard
                            key={character.id}
                            active={active}
                            disabled={disabled}
                            hint={hint}
                            name={character.name}
                            tags={character.personalityTags}
                            onClick={() => field.onChange(toggleValue(field.value, character.id, 3))}
                          />
                        )
                      })}
                    </div>
                  )}
                />
              )}

              <FieldHint error={errors.plotCharacterIds?.message} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>作成内容の確認</CardTitle>
              <CardDescription>保存前に一覧へ反映される要約を確認できます。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
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
                  <div className="space-y-2">
                    {selectedCharacters.map((character) => (
                      <div
                        key={character.id}
                        className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2 text-sm"
                      >
                        <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                          {character.name.slice(0, 1)}
                        </span>
                        <span className="line-clamp-1 text-foreground">{character.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">未選択</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" size="lg" className="h-11 w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Saving draft...
                  </>
                ) : (
                  'プロットを作成'
                )}
              </Button>
              <Button type="button" asChild variant="outline" size="lg" className="h-11 w-full">
                <Link to="/plots">キャンセル</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  )
}

export const Route = createFileRoute('/scenarios/new')({
  component: ScenarioNewPage
})
