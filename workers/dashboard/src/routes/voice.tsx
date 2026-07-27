import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
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

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>話者</CardTitle>
          <CardDescription>あなたのメッセージを読み上げる声を選びます。変更はすぐに反映されます。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Label htmlFor="speaker-select">読み上げに使う話者</Label>
          <Select value={currentId} onValueChange={(value) => setCurrentSpeaker(value)} disabled={isSwitchingSpeaker}>
            <SelectTrigger id="speaker-select" className="w-full sm:w-96">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>詳細設定</CardTitle>
          <CardDescription>
            {currentSpeaker?.name ?? '選択中の話者'}{' '}
            に適用されるパラメータです。空欄にするとサーバー側のデフォルトが使われます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SpeakerConfigForm
            key={currentId}
            speakerId={currentId}
            config={currentConfig}
            isSaving={isSavingConfig}
            isClearing={isClearingConfig}
            onSave={(config) => setSpeakerConfig({ speakerId: currentId, config })}
            onClear={() => clearSpeakerConfig(currentId)}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function VoicePage() {
  const { me, isPending } = useMe()

  if (isPending) {
    return <Skeleton className="h-64 w-full" />
  }

  if (me === null) {
    return <LoginCard />
  }

  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <VoiceSettings />
    </Suspense>
  )
}

export const Route = createFileRoute('/voice')({
  component: VoicePage
})
