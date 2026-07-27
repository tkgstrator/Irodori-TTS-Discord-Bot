import { type SpeakerConfig, SpeakerConfigSchema } from '@irodori-tts/shared/settings'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * フォームで扱うフィールド定義
 */
const FIELDS = [
  {
    key: 'numSteps',
    label: 'ステップ数',
    hint: '1〜100の整数。多いほど高品質だが遅くなる',
    placeholder: 'デフォルト'
  },
  {
    key: 'cfgScaleText',
    label: 'テキストCFG',
    hint: '0より大きい数値。テキストへの忠実度',
    placeholder: 'デフォルト'
  },
  {
    key: 'cfgScaleSpeaker',
    label: '話者CFG',
    hint: '0より大きい数値。話者らしさの強さ',
    placeholder: 'デフォルト'
  },
  {
    key: 'speakerKvScale',
    label: '話者KVスケール',
    hint: '0より大きい数値。未指定で無効',
    placeholder: '無効'
  },
  {
    key: 'truncationFactor',
    label: 'ノイズ切り詰め',
    hint: '0より大きく1以下。未指定で無効',
    placeholder: '無効'
  },
  {
    key: 'seed',
    label: 'シード',
    hint: '整数。同じ値なら同じ声になる。未指定でランダム',
    placeholder: 'ランダム'
  }
] as const satisfies ReadonlyArray<{ key: keyof SpeakerConfig; label: string; hint: string; placeholder: string }>

type FormValues = Record<keyof SpeakerConfig, string>

/**
 * 保存済みの設定を入力欄の文字列へ変換する
 */
const toFormValues = (config: SpeakerConfig): FormValues =>
  Object.fromEntries(FIELDS.map((field) => [field.key, config[field.key]?.toString() ?? ''])) as FormValues

/**
 * 入力欄の文字列を SpeakerConfig へ変換する
 *
 * 空欄は「サーバー側デフォルトに任せる」を意味するのでキーごと落とす。
 */
const toConfig = (values: FormValues): SpeakerConfig =>
  Object.fromEntries(
    FIELDS.map((field) => [field.key, values[field.key].trim()] as const)
      .filter(([, value]) => value.length > 0)
      .map(([key, value]) => [key, Number(value)])
  )

interface SpeakerConfigFormProps {
  speakerId: string
  config: SpeakerConfig
  isSaving: boolean
  isClearing: boolean
  onSave: (config: SpeakerConfig) => Promise<unknown>
  onClear: () => Promise<unknown>
}

/**
 * 話者ごとのサンプリングパラメータを編集するフォーム
 */
export function SpeakerConfigForm({
  speakerId,
  config,
  isSaving,
  isClearing,
  onSave,
  onClear
}: SpeakerConfigFormProps) {
  const [values, setValues] = useState<FormValues>(() => toFormValues(config))
  const [error, setError] = useState<string | null>(null)

  const handleChange = (key: keyof SpeakerConfig, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    const parsed = SpeakerConfigSchema.safeParse(toConfig(values))
    if (!parsed.success) {
      setError('入力値が正しくありません。各項目の説明を確認してください。')
      return
    }

    try {
      await onSave(parsed.data)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '保存に失敗しました')
    }
  }

  const handleClear = async () => {
    setError(null)
    try {
      await onClear()
      setValues(toFormValues({}))
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : 'リセットに失敗しました')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <div key={field.key} className="flex flex-col gap-1.5">
            <Label htmlFor={`${speakerId}-${field.key}`}>{field.label}</Label>
            <Input
              id={`${speakerId}-${field.key}`}
              inputMode="decimal"
              value={values[field.key]}
              placeholder={field.placeholder}
              onChange={(event) => handleChange(field.key, event.target.value)}
            />
            <p className="text-muted-foreground text-xs">{field.hint}</p>
          </div>
        ))}
      </div>

      {error !== null && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSaving}>
          保存
        </Button>
        <Button type="button" variant="outline" onClick={handleClear} disabled={isClearing}>
          デフォルトに戻す
        </Button>
      </div>
    </form>
  )
}
