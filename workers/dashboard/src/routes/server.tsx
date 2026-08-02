import type { GuildSettings } from '@irodori-tts/shared/settings'
import { createFileRoute } from '@tanstack/react-router'
import { Suspense, useState } from 'react'
import { toast } from 'sonner'
import { ComboSelect } from '@/components/combo-select'
import { LoginPanel } from '@/components/login-panel'
import { MultiComboSelect } from '@/components/multi-combo-select'
import { SettingsSection } from '@/components/settings-section'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { useMe } from '@/lib/auth'
import {
  useGuildChannels,
  useGuildSettingsMutations,
  useSuspenseGuildSettings,
  useSuspenseGuilds
} from '@/lib/guild-settings'

/**
 * オン・オフで切り替える設定項目
 */
const TOGGLES = [
  {
    key: 'readNonVcUsers',
    label: 'VC外ユーザーの読み上げ',
    hint: 'ボイスチャンネルに参加していない人のメッセージも読み上げます'
  },
  {
    key: 'announceJoin',
    label: 'VC参加アナウンス',
    hint: '誰かがボイスチャンネルに参加したときに知らせます'
  },
  {
    key: 'announceLeave',
    label: 'VC退出アナウンス',
    hint: '誰かがボイスチャンネルから退出したときに知らせます'
  }
] as const satisfies ReadonlyArray<{
  key: 'readNonVcUsers' | 'announceJoin' | 'announceLeave'
  label: string
  hint: string
}>

/**
 * 1ギルド分の設定フォーム
 *
 * 呼び出し側で `key` にギルドIDを渡し、ギルドを切り替えたら作り直す前提。
 */
function GuildSettingsForm({ guildId }: { guildId: string }) {
  const { settings } = useSuspenseGuildSettings(guildId)
  const { channels, isPending: isLoadingChannels, isError: isChannelsError } = useGuildChannels(guildId)
  const { saveSettings, isSaving } = useGuildSettingsMutations(guildId)

  const [form, setForm] = useState<GuildSettings>(settings)

  const isDirty = JSON.stringify(form) !== JSON.stringify(settings)

  // 保存済みIDのうち一覧に無いもの（スレッドや削除済みチャンネル）は
  // 選択肢から消すと保存時に落ちてしまうため、IDのまま選択肢に残す
  const knownChannels = channels === undefined ? [] : channels
  const unknownIds = form.readChannels.filter((id) => !knownChannels.some((channel) => channel.id === id))
  const channelOptions = [
    ...knownChannels.map((channel) => ({ value: channel.id, label: `# ${channel.name}` })),
    ...unknownIds.map((id) => ({ value: id, label: `# ${id}` }))
  ]

  const handleSave = async () => {
    await saveSettings(form)
    toast.success('サーバー設定を保存しました')
  }

  return (
    <div className="flex flex-col divide-y">
      <SettingsSection title="読み上げの範囲" description="どのメッセージを読み上げるかを決めます。">
        <div className="flex flex-col gap-5">
          {TOGGLES.map((toggle) => (
            <div key={toggle.key} className="flex items-start justify-between gap-6">
              <div className="flex flex-col gap-1">
                <Label htmlFor={`toggle-${toggle.key}`}>{toggle.label}</Label>
                <p className="text-muted-foreground text-xs">{toggle.hint}</p>
              </div>
              <Switch
                id={`toggle-${toggle.key}`}
                checked={form[toggle.key]}
                onCheckedChange={(checked) => setForm({ ...form, [toggle.key]: checked })}
              />
            </div>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        title="読み上げるチャンネル"
        description="選んだチャンネルのメッセージだけを読み上げます。ひとつも選ばなければ全チャンネルが対象です。"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="read-channels">対象チャンネル</Label>
          <MultiComboSelect
            id="read-channels"
            options={channelOptions}
            values={form.readChannels}
            placeholder={form.readChannels.length === 0 ? '全チャンネル' : 'チャンネルを選択'}
            searchPlaceholder="チャンネルを検索"
            emptyText="チャンネルが見つかりません"
            disabled={isLoadingChannels}
            onChange={(readChannels) => setForm({ ...form, readChannels })}
          />
          {isChannelsError && (
            <p className="text-destructive text-xs">
              チャンネル一覧を取得できませんでした。選択済みのチャンネルはそのまま保存できます。
            </p>
          )}
        </div>
      </SettingsSection>

      <div className="flex items-center gap-3 py-6">
        <Button type="button" disabled={!isDirty || isSaving} onClick={handleSave}>
          {isSaving ? '保存中...' : '保存'}
        </Button>
        <Button type="button" variant="ghost" disabled={!isDirty || isSaving} onClick={() => setForm(settings)}>
          変更を取り消す
        </Button>
      </div>
    </div>
  )
}

function ServerSettings() {
  const { guilds } = useSuspenseGuilds()
  const firstGuild = guilds[0]
  const [selectedGuildId, setSelectedGuildId] = useState<string>(firstGuild === undefined ? '' : firstGuild.id)

  const guildOptions = guilds.map((guild) => ({ value: guild.id, label: guild.name }))

  return (
    <div className="flex flex-col divide-y">
      <header className="flex flex-col gap-2 pb-10">
        <h1 className="font-brand font-bold text-3xl tracking-tight">サーバー設定</h1>
        <p className="text-muted-foreground text-sm">
          読み上げ対象のチャンネルや入退室アナウンスを切り替えます。サーバー管理権限を持つサーバーだけが表示されます。
        </p>
      </header>

      {guilds.length === 0 ? (
        <div className="py-10">
          <p className="text-muted-foreground text-sm">
            設定できるサーバーがありません。Bot
            が参加していて、かつあなたが「サーバー管理」権限を持つサーバーが必要です。
          </p>
        </div>
      ) : (
        <>
          <SettingsSection title="サーバー" description="設定を変更するサーバーを選びます。">
            <div className="flex flex-col gap-2">
              <Label htmlFor="guild-select">対象サーバー</Label>
              <ComboSelect
                id="guild-select"
                options={guildOptions}
                value={selectedGuildId}
                placeholder="サーバーを選択"
                searchPlaceholder="サーバーを検索"
                emptyText="該当するサーバーがありません"
                onSelect={setSelectedGuildId}
              />
            </div>
          </SettingsSection>

          {selectedGuildId.length > 0 && (
            <Suspense fallback={<Skeleton className="my-10 h-64 w-full" />}>
              <GuildSettingsForm key={selectedGuildId} guildId={selectedGuildId} />
            </Suspense>
          )}
        </>
      )}
    </div>
  )
}

/**
 * 読み込み中に出すページ骨格
 */
function ServerPageSkeleton() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

function ServerPage() {
  const { me, isPending } = useMe()

  if (isPending) {
    return <ServerPageSkeleton />
  }

  if (me === null) {
    return <LoginPanel />
  }

  return (
    <Suspense fallback={<ServerPageSkeleton />}>
      <ServerSettings />
    </Suspense>
  )
}

export const Route = createFileRoute('/server')({
  component: ServerPage
})
