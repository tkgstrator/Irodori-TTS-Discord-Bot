import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { BOT_GUILDS_KEY } from '@irodori-tts/shared/settings'
import type { Client, Guild } from 'discord.js'

const saddMock = mock(async (_key: string, ..._members: string[]) => 1)
const sremMock = mock(async (_key: string, ..._members: string[]) => 1)

mock.module('../src/utils/redis', () => ({
  redis: {
    sadd: saddMock,
    srem: sremMock
  }
}))

mock.module('../src/utils/notifier', () => ({
  notifyError: mock(async () => {})
}))

const { registerGuildHandler } = await import('../src/events/guild')

/**
 * ハンドラ登録だけを模したClientスタブを作る
 */
const createClientStub = () => {
  const handlers = new Map<string, (guild: Guild) => Promise<void>>()
  const client = {
    on: (event: string, handler: (guild: Guild) => Promise<void>) => {
      handlers.set(event, handler)
      return client
    }
  }
  return { client: client as unknown as Client, handlers }
}

describe('registerGuildHandler', () => {
  beforeEach(() => {
    saddMock.mockClear()
    sremMock.mockClear()
  })

  test('guildCreateでbot:guildsにSADDされる', async () => {
    const { client, handlers } = createClientStub()
    registerGuildHandler(client)

    const handler = handlers.get('guildCreate')
    expect(handler).toBeDefined()
    await handler?.({ id: 'guild-123' } as Guild)

    expect(saddMock).toHaveBeenCalledTimes(1)
    expect(saddMock).toHaveBeenCalledWith(BOT_GUILDS_KEY, 'guild-123')
  })

  test('guildDeleteでbot:guildsからSREMされる', async () => {
    const { client, handlers } = createClientStub()
    registerGuildHandler(client)

    const handler = handlers.get('guildDelete')
    expect(handler).toBeDefined()
    await handler?.({ id: 'guild-456' } as Guild)

    expect(sremMock).toHaveBeenCalledTimes(1)
    expect(sremMock).toHaveBeenCalledWith(BOT_GUILDS_KEY, 'guild-456')
  })

  test('Redis障害時もハンドラは例外を投げない', async () => {
    const { client, handlers } = createClientStub()
    registerGuildHandler(client)

    saddMock.mockImplementationOnce(async () => {
      throw new Error('redis down')
    })

    const handler = handlers.get('guildCreate')
    await expect(handler?.({ id: 'guild-789' } as Guild)).resolves.toBeUndefined()
  })
})
