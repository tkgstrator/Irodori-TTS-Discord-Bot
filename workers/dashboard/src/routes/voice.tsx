import { createFileRoute } from '@tanstack/react-router'
import { Suspense, useState } from 'react'
import { toast } from 'sonner'
import { ComboSelect } from '@/components/combo-select'
import { LoginPanel } from '@/components/login-panel'
import { SpeakerConfigForm } from '@/components/speaker-config-form'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useMe } from '@/lib/auth'
import { useBotSettingsMutations, useSuspenseMySettings, useSuspenseSpeakers } from '@/lib/bot-settings'
import type { Speaker } from '@/schemas/settings-api.dto'

/** カテゴリ未設定の話者をまとめるグループ名 */
const UNCATEGORIZED_LABEL = 'その他'

/** 話者の所属カテゴリ名（未設定は「その他」に寄せる） */
const categoryOf = (speaker: Speaker): string =>
  speaker.categoryLabel === null ? UNCATEGORIZED_LABEL : speaker.categoryLabel

/** 話者一覧から、出現順を保ったまま重複のないカテゴリ一覧を導出する（Set は挿入順を保持する） */
const deriveCategories = (speakers: readonly Speaker[]): string[] => Array.from(new Set(speakers.map(categoryOf)))

/**
 * 設定セクションの共通レイアウト
 *
 * 左に見出しと説明、右にコントロールを置く2カラム。狭い画面では縦積みになる。
 */
function SettingsSection({
  title,
  titleExtra,
  description,
  children
}: {
  title: string
  titleExtra?: React.ReactNode
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="grid gap-x-12 gap-y-6 py-10 md:grid-cols-[15rem_1fr]">
      <div className="flex flex-col gap-1.5">
        <h2 className="flex items-center gap-2 font-medium text-base">
          {title}
          {titleExtra}
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

function VoiceSettings() {
  const { settings } = useSuspenseMySettings()
  const { speakers } = useSuspenseSpeakers()
  const {
    setCurrentSpeaker,
    isSwitchingSpeaker,
    setSpeakerConfig,
    isSavingConfig,
    clearSpeakerConfig,
    isClearingConfig
  } = useBotSettingsMutations()

  const currentId = settings.speaker.currentId
  const currentSpeaker = speakers.find((speaker) => speaker.uuid === currentId)
  const storedConfig = settings.speaker.settings[currentId]
  const currentConfig = storedConfig === undefined ? {} : storedConfig
  const hasOverrides = Object.keys(currentConfig).length > 0

  const categories = deriveCategories(speakers)
  const fallbackCategory = categories[0]
  // 初期表示は保存済みの現在話者が属するカテゴリ。見つからなければ先頭カテゴリに寄せる
  const initialCategory = currentSpeaker === undefined ? fallbackCategory : categoryOf(currentSpeaker)
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory === undefined ? '' : initialCategory)

  const speakersInCategory = speakers.filter((speaker) => categoryOf(speaker) === selectedCategory)
  const categoryOptions = categories.map((category) => ({ value: category, label: category }))
  const speakerOptions = speakersInCategory.map((speaker) => ({
    value: speaker.uuid,
    label: speaker.cv === null ? speaker.name : `${speaker.name} / ${speaker.cv}`
  }))
  // 選択中カテゴリに現在の話者がいないときは未選択（プレースホルダ表示）にする。
  // カテゴリを眺めるだけでは保存 API を呼ばず、話者を選んだときだけ切り替える
  const speakerSelectValue = speakersInCategory.some((speaker) => speaker.uuid === currentId) ? currentId : ''

  const handleSpeakerChange = async (value: string) => {
    // すでにその話者なら書き込みもトーストも不要
    if (value === currentId) {
      return
    }

    const next = speakers.find((speaker) => speaker.uuid === value)
    await setCurrentSpeaker(value)
    toast.success(`話者を ${next === undefined ? '変更' : next.name} に保存しました`)
  }

  return (
    <div className="flex flex-col divide-y">
      <header className="flex flex-col gap-2 pb-10">
        <h1 className="font-brand font-bold text-3xl tracking-tight">話者設定</h1>
        <p className="text-muted-foreground text-sm">
          あなたのメッセージを読み上げる声を選び、話し方を調整します。変更はすぐ反映されます。
        </p>
      </header>

      <SettingsSection
        title="読み上げに使う声"
        description="カテゴリを選んでから話者を選びます。話者は選んだ時点で保存されます。"
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="category-select">カテゴリ</Label>
            <ComboSelect
              id="category-select"
              options={categoryOptions}
              value={selectedCategory}
              placeholder="カテゴリを選択"
              searchPlaceholder="カテゴリを検索"
              emptyText="該当するカテゴリがありません"
              onSelect={setSelectedCategory}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="speaker-select">話者</Label>
            {/* 選択と同時に保存される。下の詳細設定だけが「保存」ボタン式なので、その差を明示する */}
            <ComboSelect
              id="speaker-select"
              options={speakerOptions}
              value={speakerSelectValue}
              placeholder="話者を選択"
              searchPlaceholder="話者を検索"
              emptyText="該当する話者がいません"
              disabled={isSwitchingSpeaker}
              onSelect={handleSpeakerChange}
            />
            <p className="text-muted-foreground text-xs">選ぶとそのまま保存され、次の読み上げから反映されます。</p>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="詳細設定"
        titleExtra={
          hasOverrides ? (
            <Badge variant="outline" className="font-normal">
              カスタム
            </Badge>
          ) : undefined
        }
        description={`${currentSpeaker === undefined ? '選択中の話者' : currentSpeaker.name} に適用されます。空欄にするとサーバー側のデフォルトに戻ります。`}
      >
        <SpeakerConfigForm
          key={currentId}
          speakerId={currentId}
          config={currentConfig}
          defaults={currentSpeaker === undefined ? {} : currentSpeaker.defaults}
          isSaving={isSavingConfig}
          isClearing={isClearingConfig}
          onSave={async (config) => {
            await setSpeakerConfig({ speakerId: currentId, config })
            toast.success('話者設定を保存しました')
          }}
          onClear={async () => {
            await clearSpeakerConfig(currentId)
            toast.success('デフォルトに戻しました')
          }}
        />
      </SettingsSection>
    </div>
  )
}

/**
 * 読み込み中に出すページ骨格
 */
function VoicePageSkeleton() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

function VoicePage() {
  const { me, isPending } = useMe()

  if (isPending) {
    return <VoicePageSkeleton />
  }

  if (me === null) {
    return <LoginPanel />
  }

  return (
    <Suspense fallback={<VoicePageSkeleton />}>
      <VoiceSettings />
    </Suspense>
  )
}

export const Route = createFileRoute('/voice')({
  component: VoicePage
})
