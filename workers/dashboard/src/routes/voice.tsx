import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { toast } from 'sonner'
import { LoginCard } from '@/components/login-card'
import { SpeakerConfigForm } from '@/components/speaker-config-form'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useMe } from '@/lib/auth'
import { useBotSettingsMutations, useSuspenseMySettings, useSuspenseSpeakers } from '@/lib/bot-settings'

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
  const currentConfig = settings.speaker.settings[currentId] ?? {}
  const hasOverrides = Object.keys(currentConfig).length > 0

  const handleSpeakerChange = async (value: string) => {
    await setCurrentSpeaker(value)
    const next = speakers.find((speaker) => speaker.uuid === value)
    toast.success(`話者を ${next?.name ?? '変更'} に切り替えました`)
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-brand text-2xl">話者設定</h1>
        <p className="text-muted-foreground text-sm">
          あなたのメッセージを読み上げる声を選び、話し方を調整します。変更はすぐ反映されます。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">読み上げに使う声</CardTitle>
          <CardDescription>Irodori-TTS に登録されている話者から選べます。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Label htmlFor="speaker-select">話者</Label>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={currentId} onValueChange={handleSpeakerChange} disabled={isSwitchingSpeaker}>
              <SelectTrigger id="speaker-select" className="w-full sm:w-80">
                <SelectValue placeholder="話者を選択" />
              </SelectTrigger>
              <SelectContent>
                {speakers.map((speaker) => (
                  <SelectItem key={speaker.uuid} value={speaker.uuid}>
                    {speaker.name}
                    {speaker.cv !== null && ` / ${speaker.cv}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentSpeaker?.categoryLabel != null && <Badge variant="secondary">{currentSpeaker.categoryLabel}</Badge>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            詳細設定
            {hasOverrides && (
              <Badge variant="outline" className="font-normal">
                カスタム
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {currentSpeaker?.name ?? '選択中の話者'} に適用されます。空欄にするとサーバー側のデフォルトに戻ります。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SpeakerConfigForm
            key={currentId}
            speakerId={currentId}
            config={currentConfig}
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
        </CardContent>
      </Card>
    </div>
  )
}

function VoicePage() {
  const { me, isPending } = useMe()

  if (isPending) {
    return <Skeleton className="h-72 w-full" />
  }

  if (me === null) {
    return <LoginCard />
  }

  return (
    <Suspense fallback={<Skeleton className="h-72 w-full" />}>
      <VoiceSettings />
    </Suspense>
  )
}

export const Route = createFileRoute('/voice')({
  component: VoicePage
})
