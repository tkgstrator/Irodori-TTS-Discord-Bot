import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, Camera, Check, ChevronLeft, Plus, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useCallback, useRef, useState } from 'react'
import type { Resolver } from 'react-hook-form'
import { Controller, useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  AGE_GROUPS,
  FIRST_PERSONS,
  GENDERS,
  HONORIFICS,
  OCCUPATIONS,
  SECOND_PERSONS,
  SPEECH_STYLES
} from '@/lib/character-options'
import { mergeImportedValues } from '@/lib/speaker-import'
import { cn } from '@/lib/utils'
import type { CharacterFormValues, SpeakerLink } from '@/schemas/character.dto'
import { CharacterFormSchema } from '@/schemas/character.dto'
import type { SpeakerImportTemplate } from '@/schemas/speaker.dto'

const STEPS = [
  { label: '基本情報', description: 'キャラクターの基本プロフィールを設定してください' },
  { label: '性格・口調', description: 'キャラクターの性格と話し方を設定してください' },
  { label: '属性・背景', description: '属性タグ・経歴・設定メモを入力してください' }
] as const

const STEP_FIELDS: readonly (readonly string[])[] = [
  ['name', 'caption', 'ageGroup', 'gender', 'occupation'],
  ['personalityTags', 'speechStyle', 'firstPerson', 'secondPerson', 'honorific', 'sampleQuotes'],
  ['attributeTags', 'backgroundTags', 'memo']
]
const maxSampleQuoteCount = 5

const PERSONALITY_TAGS = [
  '明るい',
  '内気',
  '寡黙',
  '熱血',
  '穏やか',
  '優しい',
  '真面目',
  '天然',
  '傲慢',
  '勇敢',
  '自信家',
  '楽観的',
  '論理的',
  '頑固',
  '好奇心旺盛',
  '義理堅い'
] as const

const SECOND_PERSON_OPTIONS = [{ value: '_none', label: '(なし)' }, ...SECOND_PERSONS] as const

const ATTRIBUTE_TAGS = [
  '眼鏡',
  'ツンデレ',
  'ヤンデレ',
  'クーデレ',
  '元気',
  '読書家',
  '体育会系',
  'お嬢様',
  'メイド',
  'いたずらっ子'
] as const

const BACKGROUND_TAGS = ['孤児', '名家出身', '異世界転移', '記憶喪失', '天才', 'トラウマ'] as const

export const DEFAULT_VALUES: CharacterFormValues = {
  name: '',
  ageGroup: 'young_adult',
  gender: 'male',
  occupation: 'student_high',
  personalityTags: [],
  speechStyle: 'neutral',
  firstPerson: 'boku',
  secondPerson: '',
  honorific: 'san',
  attributeTags: [],
  backgroundTags: [],
  sampleQuotes: [],
  memo: '',
  speakerId: null,
  caption: null
}

// 生成した blob URL だけを安全に解放する
const revokeObjectUrl = (value: string | null) => {
  if (value?.startsWith('blob:')) {
    URL.revokeObjectURL(value)
  }
}

function toggleInArray(arr: readonly string[], value: string, max: number): string[] {
  if (arr.includes(value)) {
    return arr.filter((v) => v !== value)
  }
  if (arr.length >= max) return [...arr]
  return [...arr, value]
}

function ChipGroup({
  options,
  selected,
  onToggle
}: {
  options: readonly string[]
  selected: readonly string[]
  onToggle: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((tag) => {
        const active = selected.includes(tag)
        return (
          <button
            key={tag}
            type="button"
            onClick={() => onToggle(tag)}
            className={cn(
              'inline-flex items-center rounded-full border px-2.5 py-1 text-xs transition-colors',
              active ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'
            )}
          >
            {tag}
          </button>
        )
      })}
    </div>
  )
}

function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-0">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1
        const done = step < current
        const active = step === current
        return (
          <div key={step} className="contents">
            {i > 0 && <div className={cn('mb-5 h-0.5 flex-1 transition-colors', done ? 'bg-primary' : 'bg-border')} />}
            <div className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex size-8 items-center justify-center rounded-full text-sm transition-all',
                  done && 'bg-primary text-primary-foreground',
                  active &&
                    'bg-primary font-semibold text-primary-foreground ring-4 ring-ring ring-offset-2 ring-offset-background',
                  !done && !active && 'border-2 border-border bg-background text-muted-foreground'
                )}
              >
                {done ? <Check className="size-3.5" /> : step}
              </div>
              <span className={cn('text-xs', active ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                {STEPS[i]?.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ControlledSelect({
  label,
  hint,
  options,
  value,
  onChange,
  error
}: {
  label: string
  hint?: string
  options: readonly { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
  error?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={cn('w-full', error && 'border-destructive')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function ImageUpload({
  imageUrl,
  onImageChange
}: {
  imageUrl: string | null
  onImageChange: (file: File | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (file: File | null) => {
      if (file?.type.startsWith('image/')) {
        onImageChange(file)
      }
    },
    [onImageChange]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0] ?? null
      handleFile(file)
    },
    [handleFile]
  )

  return (
    <div className="relative size-24 shrink-0">
      {imageUrl ? (
        <>
          <img src={imageUrl} alt="キャラクター画像" className="size-24 rounded-xl border border-border object-cover" />
          <button
            type="button"
            onClick={() => onImageChange(null)}
            className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            <Trash2 className="size-3" />
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex size-24 items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          aria-label="画像を追加"
        >
          <Camera className="size-6" />
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
    </div>
  )
}

function Step1({
  control,
  errors,
  imageUrl,
  onImageChange,
  actions
}: {
  control: ReturnType<typeof useForm<CharacterFormValues>>['control']
  errors: ReturnType<typeof useForm<CharacterFormValues>>['formState']['errors']
  imageUrl: string | null
  onImageChange: (file: File | null) => void
  actions?: ReactNode
}) {
  return (
    <div className="space-y-4">
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      <div className="flex items-start gap-4">
        <ImageUpload imageUrl={imageUrl} onImageChange={onImageChange} />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label>
            名前 <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                type="text"
                placeholder="キャラクター名"
                className={cn(errors.name && 'border-destructive')}
                {...field}
              />
            )}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>
          caption <span className="text-destructive">*</span>
          <span className="text-xs font-normal text-muted-foreground"> 話者連携しない場合に必須</span>
        </Label>
        <Controller
          name="caption"
          control={control}
          render={({ field }) => (
            <Textarea
              placeholder="例: 落ち着いた女性ナレーション。低めで柔らかく、説明調。"
              rows={3}
              className={cn(errors.caption && 'border-destructive')}
              value={field.value ?? ''}
              onChange={(event) => field.onChange(event.target.value)}
            />
          )}
        />
        {errors.caption ? (
          <p className="text-xs text-destructive">{errors.caption.message}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            音声話者を連携しないキャラクターは、この caption をもとに声色を決めます。
          </p>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Controller
          name="ageGroup"
          control={control}
          render={({ field }) => (
            <ControlledSelect label="年齢層" options={AGE_GROUPS} value={field.value} onChange={field.onChange} />
          )}
        />
        <Controller
          name="gender"
          control={control}
          render={({ field }) => (
            <ControlledSelect label="性別" options={GENDERS} value={field.value} onChange={field.onChange} />
          )}
        />
        <Controller
          name="occupation"
          control={control}
          render={({ field }) => (
            <ControlledSelect label="職業" options={OCCUPATIONS} value={field.value} onChange={field.onChange} />
          )}
        />
      </div>
    </div>
  )
}

function Step2({
  control,
  errors
}: {
  control: ReturnType<typeof useForm<CharacterFormValues>>['control']
  errors: ReturnType<typeof useForm<CharacterFormValues>>['formState']['errors']
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>
          性格タグ <span className="text-destructive">*</span>
          <span className="text-xs font-normal text-muted-foreground">1〜4個選択</span>
        </Label>
        <Controller
          name="personalityTags"
          control={control}
          render={({ field }) => (
            <ChipGroup
              options={PERSONALITY_TAGS}
              selected={field.value}
              onToggle={(tag) => field.onChange(toggleInArray(field.value, tag, 4))}
            />
          )}
        />
        {errors.personalityTags && <p className="text-xs text-destructive">{errors.personalityTags.message}</p>}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Controller
          name="speechStyle"
          control={control}
          render={({ field }) => (
            <ControlledSelect label="口調" options={SPEECH_STYLES} value={field.value} onChange={field.onChange} />
          )}
        />
        <Controller
          name="firstPerson"
          control={control}
          render={({ field }) => (
            <ControlledSelect label="一人称" options={FIRST_PERSONS} value={field.value} onChange={field.onChange} />
          )}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Controller
          name="secondPerson"
          control={control}
          render={({ field }) => (
            <ControlledSelect
              label="二人称"
              hint="任意"
              options={SECOND_PERSON_OPTIONS}
              value={field.value || '_none'}
              onChange={(v) => field.onChange(v === '_none' ? '' : v)}
            />
          )}
        />
        <Controller
          name="honorific"
          control={control}
          render={({ field }) => (
            <ControlledSelect
              label="デフォルト敬称"
              options={HONORIFICS}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </div>
      <div className="space-y-2">
        <Label>
          セリフサンプル <span className="text-xs font-normal text-muted-foreground">0〜5件任意 / 1件40文字以内</span>
        </Label>
        <Controller
          name="sampleQuotes"
          control={control}
          render={({ field }) => (
            <div className="space-y-3">
              {field.value.length > 0 ? (
                field.value.map((sampleQuote, index) => {
                  const duplicateCount = field.value.slice(0, index).filter((item) => item === sampleQuote).length
                  const sampleQuoteKey = `${sampleQuote}-${duplicateCount}`

                  return (
                    <div key={sampleQuoteKey} className="flex items-start gap-2">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <Input
                          type="text"
                          maxLength={40}
                          value={sampleQuote}
                          placeholder={`セリフサンプル ${index + 1}`}
                          onChange={(event) =>
                            field.onChange(
                              field.value.map((item, itemIndex) => (itemIndex === index ? event.target.value : item))
                            )
                          }
                        />
                        <p className="text-right text-[11px] text-muted-foreground">{sampleQuote.length} / 40</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label="セリフサンプルを削除"
                        onClick={() => field.onChange(field.value.filter((_, itemIndex) => itemIndex !== index))}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-muted-foreground">
                  キャラクターらしい短い口癖や言い回しを入れると、生成時の口調が安定します。
                </p>
              )}
              {field.value.length < maxSampleQuoteCount && (
                <Button type="button" variant="outline" size="sm" onClick={() => field.onChange([...field.value, ''])}>
                  <Plus data-icon="inline-start" />
                  セリフサンプルを追加
                </Button>
              )}
            </div>
          )}
        />
        {errors.sampleQuotes && <p className="text-xs text-destructive">{errors.sampleQuotes.message}</p>}
      </div>
    </div>
  )
}

function Step3({
  control,
  errors
}: {
  control: ReturnType<typeof useForm<CharacterFormValues>>['control']
  errors: ReturnType<typeof useForm<CharacterFormValues>>['formState']['errors']
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>
          属性タグ <span className="text-xs font-normal text-muted-foreground">0〜4個任意</span>
        </Label>
        <Controller
          name="attributeTags"
          control={control}
          render={({ field }) => (
            <ChipGroup
              options={ATTRIBUTE_TAGS}
              selected={field.value}
              onToggle={(tag) => field.onChange(toggleInArray(field.value, tag, 4))}
            />
          )}
        />
        {errors.attributeTags && <p className="text-xs text-destructive">{errors.attributeTags.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>
          経歴タグ <span className="text-xs font-normal text-muted-foreground">0〜3個任意</span>
        </Label>
        <Controller
          name="backgroundTags"
          control={control}
          render={({ field }) => (
            <ChipGroup
              options={BACKGROUND_TAGS}
              selected={field.value}
              onToggle={(tag) => field.onChange(toggleInArray(field.value, tag, 3))}
            />
          )}
        />
        {errors.backgroundTags && <p className="text-xs text-destructive">{errors.backgroundTags.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>
          説明メモ <span className="text-xs font-normal text-muted-foreground">任意</span>
        </Label>
        <Controller
          name="memo"
          control={control}
          render={({ field }) => <Textarea placeholder="その他の設定メモ..." rows={3} {...field} />}
        />
      </div>
    </div>
  )
}

export function CharacterWizard({
  title,
  subtitle,
  submitLabel,
  defaultValues,
  initialImageUrl,
  initialSpeaker,
  stepOneActions,
  onSubmit,
  onCancel
}: {
  title: string
  subtitle: string
  submitLabel: string
  defaultValues: CharacterFormValues
  initialImageUrl?: string | null
  initialSpeaker?: SpeakerLink | null
  stepOneActions?: (context: {
    linkedSpeaker: SpeakerLink | null
    applySpeakerTemplate: (template: SpeakerImportTemplate) => void
    clearSpeaker: () => void
    isSubmitting: boolean
  }) => ReactNode
  onSubmit: (data: CharacterFormValues, imageUrl: string | null) => Promise<void> | void
  onCancel: () => void
}) {
  const [step, setStep] = useState(0)
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl ?? null)
  const [linkedSpeaker, setLinkedSpeaker] = useState<SpeakerLink | null>(initialSpeaker ?? null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleImageChange = useCallback(
    (file: File | null) => {
      revokeObjectUrl(imageUrl)
      setImageUrl(file ? URL.createObjectURL(file) : null)
    },
    [imageUrl]
  )

  const {
    control,
    getValues,
    reset,
    setValue,
    trigger,
    handleSubmit,
    formState: { errors }
  } = useForm<CharacterFormValues>({
    resolver: zodResolver(CharacterFormSchema) as Resolver<CharacterFormValues>,
    defaultValues
  })

  // 話者テンプレートをフォームへ反映し、空値で既存入力を消さない
  const applySpeakerTemplate = (template: SpeakerImportTemplate) => {
    const currentValues = getValues()
    const mergedValues = mergeImportedValues(currentValues, template.values)

    reset({
      ...mergedValues,
      speakerId: template.speaker.id
    } as CharacterFormValues)
    void trigger(['speakerId', 'caption'])
    setLinkedSpeaker(template.speaker)
  }

  // 明示的な話者連携を解除する
  const clearSpeaker = () => {
    setValue('speakerId', null, {
      shouldDirty: true,
      shouldTouch: true
    })
    void trigger(['speakerId', 'caption'])
    setLinkedSpeaker(null)
  }

  const isLast = step === STEPS.length - 1

  const handleNext = async () => {
    const fields = STEP_FIELDS[step] as (keyof CharacterFormValues)[]
    const valid = await trigger(fields)
    if (!valid) return

    if (isLast) {
      await handleSubmit(async (data) => {
        setIsSubmitting(true)
        try {
          await onSubmit(data as CharacterFormValues, imageUrl)
        } finally {
          setIsSubmitting(false)
        }
      })()
      return
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const handleBack = () => {
    if (step === 0) {
      onCancel()
      return
    }
    setStep((s) => Math.max(s - 1, 0))
  }

  const stepInfo = STEPS[step]
  const stepOneActionNodes = stepOneActions?.({
    linkedSpeaker,
    applySpeakerTemplate,
    clearSpeaker,
    isSubmitting
  })

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 overflow-y-auto pt-4 pb-24 sm:pb-24">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          一覧に戻る
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="mx-auto mb-8 max-w-xl">
          <StepProgress current={step + 1} total={STEPS.length} />
        </div>

        <form className="mx-auto max-w-xl" onSubmit={(e) => e.preventDefault()}>
          <div className="rounded-xl border border-border bg-card p-6 ring-1 ring-foreground/5">
            <div className="mb-5">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Step {step + 1} / {STEPS.length}
              </p>
              <h2 className="text-lg font-semibold">{stepInfo?.label}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{stepInfo?.description}</p>
            </div>

            {step === 0 && (
              <Step1
                control={control as unknown as import('react-hook-form').Control<CharacterFormValues>}
                errors={errors}
                imageUrl={imageUrl}
                onImageChange={handleImageChange}
                actions={stepOneActionNodes}
              />
            )}
            {step === 1 && (
              <Step2
                control={control as unknown as import('react-hook-form').Control<CharacterFormValues>}
                errors={errors}
              />
            )}
            {step === 2 && (
              <Step3
                control={control as unknown as import('react-hook-form').Control<CharacterFormValues>}
                errors={errors}
              />
            )}
          </div>
        </form>
      </div>

      <footer className="sticky bottom-0 z-10 border-t border-border bg-background">
        <div className="mx-auto flex h-16 max-w-xl items-center justify-between sm:px-6">
          <Button variant="outline" size="lg" onClick={handleBack} disabled={isSubmitting}>
            <ArrowLeft data-icon="inline-start" />
            {step === 0 ? 'キャンセル' : '前へ'}
          </Button>
          <span className="text-sm text-muted-foreground">
            {step + 1} / {STEPS.length}
          </span>
          <Button size="lg" onClick={handleNext} disabled={isSubmitting}>
            {isLast ? (isSubmitting ? '保存中...' : submitLabel) : '次へ'}
            {!isLast && <ArrowRight data-icon="inline-end" />}
          </Button>
        </div>
      </footer>
    </div>
  )
}
