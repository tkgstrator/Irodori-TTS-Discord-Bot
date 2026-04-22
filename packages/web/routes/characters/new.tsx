import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, Camera, Check, ChevronLeft, Trash2, VolumeOff } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/characters/new')({
  component: CharacterNewPage
})

const STEPS = [
  { label: '基本情報', description: 'キャラクターの基本プロフィールを設定してください' },
  { label: '性格・口調', description: 'キャラクターの性格と話し方を設定してください' },
  { label: '属性・背景', description: '属性タグ・経歴・設定メモを入力してください' }
] as const

const STEP_FIELDS: readonly (readonly string[])[] = [
  ['name', 'ageGroup', 'gender', 'occupation'],
  ['personalityTags', 'speechStyle', 'firstPerson', 'secondPerson', 'honorific'],
  ['attributeTags', 'backgroundTags', 'memo']
]

const AGE_GROUPS = [
  { value: 'infant', label: '乳幼児' },
  { value: 'child', label: '子供' },
  { value: 'preteen', label: '小学生' },
  { value: 'teen', label: '10代' },
  { value: 'young_adult', label: '青年' },
  { value: 'adult', label: '成人' },
  { value: 'middle_aged', label: '中年' },
  { value: 'elderly', label: '高齢' },
  { value: 'ageless', label: '不老' }
] as const

const GENDERS = [
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'nonbinary', label: 'ノンバイナリー' },
  { value: 'unknown', label: '不明' },
  { value: 'other', label: 'その他' }
] as const

const OCCUPATIONS = [
  { value: 'student_high', label: '高校生' },
  { value: 'student_college', label: '大学生' },
  { value: 'teacher', label: '教師' },
  { value: 'engineer', label: 'エンジニア' },
  { value: 'adventurer', label: '冒険者' },
  { value: 'knight', label: '騎士' },
  { value: 'mage', label: '魔法使い' },
  { value: 'detective', label: '探偵' },
  { value: 'doctor', label: '医師' },
  { value: 'merchant', label: '商人' },
  { value: 'other', label: 'その他' }
] as const

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

const SPEECH_STYLES = [
  { value: 'polite_formal', label: '丁寧語' },
  { value: 'polite_casual', label: 'やや丁寧' },
  { value: 'neutral', label: '標準' },
  { value: 'casual_youthful', label: 'カジュアル（若者）' },
  { value: 'rough_masculine', label: '荒い（男性的）' },
  { value: 'refined_feminine', label: '上品（女性的）' },
  { value: 'archaic_samurai', label: '武士風' },
  { value: 'archaic_court', label: '宮廷風' },
  { value: 'dialect_regional', label: '方言' },
  { value: 'childlike', label: '子供っぽい' },
  { value: 'eccentric', label: '独特' }
] as const

const FIRST_PERSON = [
  { value: 'watashi', label: '私' },
  { value: 'watakushi', label: 'わたくし' },
  { value: 'atashi', label: 'あたし' },
  { value: 'boku', label: '僕' },
  { value: 'ore', label: '俺' },
  { value: 'uchi', label: 'うち' },
  { value: 'washi', label: 'ワシ' },
  { value: 'name', label: '自分の名前' },
  { value: 'other', label: 'その他' }
] as const

const SECOND_PERSON = [
  { value: '_none', label: '(なし)' },
  { value: 'kimi', label: '君' },
  { value: 'omae', label: 'お前' },
  { value: 'anata', label: 'あなた' },
  { value: 'kisama', label: '貴様' },
  { value: 'onushi', label: 'お主' },
  { value: 'other', label: 'その他' }
] as const

const HONORIFICS = [
  { value: 'none', label: '呼び捨て' },
  { value: 'san', label: '〜さん' },
  { value: 'chan', label: '〜ちゃん' },
  { value: 'kun', label: '〜君' },
  { value: 'sama', label: '〜様' },
  { value: 'senpai', label: '〜先輩' },
  { value: 'sensei', label: '〜先生' }
] as const

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

const characterSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  ageGroup: z.string(),
  gender: z.string(),
  occupation: z.string(),
  personalityTags: z.array(z.string()).min(1, '性格タグを1つ以上選択してください').max(4, '性格タグは4つまでです'),
  speechStyle: z.string(),
  firstPerson: z.string(),
  secondPerson: z.string(),
  honorific: z.string(),
  attributeTags: z.array(z.string()).max(4, '属性タグは4つまでです'),
  backgroundTags: z.array(z.string()).max(3, '経歴タグは3つまでです'),
  memo: z.string()
})

type CharacterForm = z.infer<typeof characterSchema>

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
                {STEPS[i].label}
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
    <div className="space-y-1.5">
      <Label>
        キャラクター画像 <span className="text-xs font-normal text-muted-foreground">任意</span>
      </Label>
      {imageUrl ? (
        <div className="relative inline-block">
          <img src={imageUrl} alt="キャラクター画像" className="size-24 rounded-xl border border-border object-cover" />
          <button
            type="button"
            onClick={() => onImageChange(null)}
            className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex size-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Camera className="size-5" />
          <span className="text-[10px]">画像を追加</span>
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
  onImageChange
}: {
  control: ReturnType<typeof useForm<CharacterForm>>['control']
  errors: ReturnType<typeof useForm<CharacterForm>>['formState']['errors']
  imageUrl: string | null
  onImageChange: (file: File | null) => void
}) {
  return (
    <div className="space-y-4">
      <ImageUpload imageUrl={imageUrl} onImageChange={onImageChange} />
      <div className="space-y-1.5">
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
      </div>
      <Controller
        name="occupation"
        control={control}
        render={({ field }) => (
          <ControlledSelect label="職業" options={OCCUPATIONS} value={field.value} onChange={field.onChange} />
        )}
      />
    </div>
  )
}

function Step2({
  control,
  errors
}: {
  control: ReturnType<typeof useForm<CharacterForm>>['control']
  errors: ReturnType<typeof useForm<CharacterForm>>['formState']['errors']
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
            <ControlledSelect label="一人称" options={FIRST_PERSON} value={field.value} onChange={field.onChange} />
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
              options={SECOND_PERSON}
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
    </div>
  )
}

function Step3({
  control,
  errors
}: {
  control: ReturnType<typeof useForm<CharacterForm>>['control']
  errors: ReturnType<typeof useForm<CharacterForm>>['formState']['errors']
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

function findLabel(options: readonly { value: string; label: string }[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? ''
}

function CharacterPreview({
  control,
  imageUrl
}: {
  control: ReturnType<typeof useForm<CharacterForm>>['control']
  imageUrl: string | null
}) {
  const values = useWatch({ control })

  const name = values.name || 'キャラクター名'
  const firstChar = name.charAt(0) || '?'
  const ageLabel = findLabel([...AGE_GROUPS], values.ageGroup ?? '')
  const genderLabel = findLabel([...GENDERS], values.gender ?? '')
  const occupationLabel = findLabel([...OCCUPATIONS], values.occupation ?? '')
  const speechLabel = findLabel([...SPEECH_STYLES], values.speechStyle ?? '')
  const firstPersonLabel = findLabel([...FIRST_PERSON], values.firstPerson ?? '')
  const honorificLabel = findLabel([...HONORIFICS], values.honorific ?? '')
  const personality = values.personalityTags ?? []
  const attributes = values.attributeTags ?? []
  const background = values.backgroundTags ?? []

  return (
    <div className="sticky top-6 space-y-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">プレビュー</p>

      <div className="rounded-xl border border-border bg-card p-5 ring-1 ring-foreground/5">
        <div className="mb-4 flex items-start gap-3">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="size-14 shrink-0 rounded-full border border-border object-cover" />
          ) : (
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
              {firstChar}
            </div>
          )}
          <div className="min-w-0">
            <p className={cn('text-lg font-semibold', !values.name && 'text-muted-foreground')}>{name}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {[genderLabel, ageLabel, occupationLabel].filter(Boolean).join(' / ') || '—'}
            </p>
          </div>
        </div>

        {personality.length > 0 && (
          <div className="mb-3">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">性格</p>
            <div className="flex flex-wrap gap-1.5">
              {personality.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {(speechLabel || firstPersonLabel) && (
          <div className="mb-3">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">口調</p>
            <p className="text-sm">
              {[
                speechLabel,
                firstPersonLabel ? `一人称: ${firstPersonLabel}` : '',
                honorificLabel ? `敬称: ${honorificLabel}` : ''
              ]
                .filter(Boolean)
                .join(' / ')}
            </p>
          </div>
        )}

        {attributes.length > 0 && (
          <div className="mb-3">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">属性</p>
            <div className="flex flex-wrap gap-1.5">
              {attributes.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {background.length > 0 && (
          <div className="mb-3">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">経歴</p>
            <div className="flex flex-wrap gap-1.5">
              {background.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {values.memo && (
          <div className="mb-3">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">メモ</p>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{values.memo}</p>
          </div>
        )}

        <div className="mt-4 border-t border-border pt-3">
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <VolumeOff className="size-2.5" />
            音声未設定
          </Badge>
        </div>
      </div>
    </div>
  )
}

function CharacterNewPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const handleImageChange = useCallback(
    (file: File | null) => {
      if (imageUrl) URL.revokeObjectURL(imageUrl)
      setImageUrl(file ? URL.createObjectURL(file) : null)
    },
    [imageUrl]
  )

  const {
    control,
    trigger,
    handleSubmit,
    formState: { errors }
  } = useForm<CharacterForm>({
    resolver: zodResolver(characterSchema),
    defaultValues: {
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
      memo: ''
    }
  })

  const isLast = step === STEPS.length - 1

  const handleNext = async () => {
    const fields = STEP_FIELDS[step] as (keyof CharacterForm)[]
    const valid = await trigger(fields)
    if (!valid) return

    if (isLast) {
      handleSubmit((data) => {
        console.log('submit', data)
        navigate({ to: '/characters' })
      })()
      return
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const handleBack = () => {
    if (step === 0) {
      navigate({ to: '/characters' })
      return
    }
    setStep((s) => Math.max(s - 1, 0))
  }

  const stepInfo = STEPS[step]

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 overflow-y-auto p-4 pb-24 sm:p-6 sm:pb-24">
        <Link
          to="/characters"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          一覧に戻る
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">キャラクター新規作成</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">ウィザード形式で順番に設定します</p>
        </div>

        <div className="mb-8 max-w-2xl">
          <StepProgress current={step + 1} total={STEPS.length} />
        </div>

        <div className="flex items-start gap-8">
          <form className="w-full max-w-2xl shrink-0" onSubmit={(e) => e.preventDefault()}>
            <div className="rounded-xl border border-border bg-card p-6 ring-1 ring-foreground/5">
              <div className="mb-5">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Step {step + 1} / {STEPS.length}
                </p>
                <h2 className="text-lg font-semibold">{stepInfo.label}</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">{stepInfo.description}</p>
              </div>

              {step === 0 && (
                <Step1 control={control} errors={errors} imageUrl={imageUrl} onImageChange={handleImageChange} />
              )}
              {step === 1 && <Step2 control={control} errors={errors} />}
              {step === 2 && <Step3 control={control} errors={errors} />}
            </div>
          </form>

          <aside className="hidden w-80 shrink-0 xl:block">
            <CharacterPreview control={control} imageUrl={imageUrl} />
          </aside>
        </div>
      </div>

      <footer className="sticky bottom-0 z-10 border-t border-border bg-background">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4 sm:px-6">
          <Button variant="outline" size="lg" onClick={handleBack}>
            <ArrowLeft data-icon="inline-start" />
            {step === 0 ? 'キャンセル' : '前へ'}
          </Button>
          <span className="text-sm text-muted-foreground">
            {step + 1} / {STEPS.length}
          </span>
          <Button size="lg" onClick={handleNext}>
            {isLast ? '作成する' : '次へ'}
            {!isLast && <ArrowRight data-icon="inline-end" />}
          </Button>
        </div>
      </footer>
    </div>
  )
}
