import { SpeakerConfigSchema, UserSettingsSchema } from '@irodori-tts/shared/settings'
import { Hono } from 'hono'
import { CurrentSpeakerInputSchema } from '../../schemas/settings-api.dto'
import { requireSession, type SessionVariables } from '../session'
import {
  clearSpeakerConfig,
  getUserSettings,
  setCurrentSpeakerId,
  setSpeakerConfig,
  setUserSettings
} from '../user-settings'

export const meSettings = new Hono<{ Variables: SessionVariables }>()

meSettings.use('*', requireSession)

/**
 * 自分の設定を取得する
 */
meSettings.get('/settings', async (c) => {
  const userId = c.get('session').data.user.id
  return c.json(await getUserSettings(userId))
})

/**
 * 自分の設定をまるごと置き換える
 */
meSettings.put('/settings', async (c) => {
  const parsed = UserSettingsSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400)
  }

  const userId = c.get('session').data.user.id
  return c.json(await setUserSettings(userId, parsed.data))
})

/**
 * 現在の話者を切り替える
 */
meSettings.put('/settings/speaker', async (c) => {
  const parsed = CurrentSpeakerInputSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400)
  }

  const userId = c.get('session').data.user.id
  return c.json(await setCurrentSpeakerId(userId, parsed.data.currentId))
})

/**
 * 特定の話者の詳細設定を保存する（未指定のフィールドはサーバー側デフォルトに戻る）
 */
meSettings.put('/settings/speakers/:speakerId', async (c) => {
  const parsed = SpeakerConfigSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400)
  }

  const userId = c.get('session').data.user.id
  return c.json(await setSpeakerConfig(userId, c.req.param('speakerId'), parsed.data))
})

/**
 * 特定の話者の詳細設定を削除する
 */
meSettings.delete('/settings/speakers/:speakerId', async (c) => {
  const userId = c.get('session').data.user.id
  return c.json(await clearSpeakerConfig(userId, c.req.param('speakerId')))
})
