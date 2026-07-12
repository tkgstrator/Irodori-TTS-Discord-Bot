import { beforeEach, describe, expect, mock, test } from 'bun:test'
import type { Client } from 'discord.js'
import type { PcmAudio } from '../src/utils/tts'

interface TtsCallMeta {
  authorId?: string
  lineIndex?: number
}

interface PendingEntry {
  resolve: (audio: PcmAudio) => void
  reject: (error: unknown) => void
  meta?: TtsCallMeta
}

// テキストごとに合成の解決を手動で制御するための保留マップ
const pending = new Map<string, PendingEntry>()
const callOrder: string[] = []

const textToSpeechWithSettingsMock = mock(
  (text: string, _speakerId: string, _speakerConfig: unknown, meta?: TtsCallMeta): Promise<PcmAudio> => {
    callOrder.push(text)
    return new Promise<PcmAudio>((resolve, reject) => {
      pending.set(text, { resolve, reject, meta })
    })
  }
)

const resolveLine = (text: string): void => {
  const entry = pending.get(text)
  if (!entry) throw new Error(`No pending TTS call for line: ${text}`)
  pending.delete(text)
  entry.resolve({
    buffer: Buffer.from(text),
    sampleRate: 24000,
    authorId: entry.meta?.authorId,
    lineIndex: entry.meta?.lineIndex
  })
}

const rejectLine = (text: string, error: unknown = new Error(`synthesis failed: ${text}`)): void => {
  const entry = pending.get(text)
  if (!entry) throw new Error(`No pending TTS call for line: ${text}`)
  pending.delete(text)
  entry.reject(error)
}

const getGuildSettingsMock = mock(async () => ({
  readNonVcUsers: true,
  announceJoin: true,
  announceLeave: true,
  readChannels: [] as string[]
}))

const getCurrentSpeakerContextMock = mock(async (_userId: string) => ({
  speakerId: 'speaker-1',
  config: {}
}))

const preprocessMessageForTtsMock = mock((text: string) => text)
const preprocessForTtsMock = mock((text: string): string | null => text)

const notifyErrorMock = mock(async () => {})

const enqueueAudioMock = mock(async (_guildId: string, _audio: PcmAudio, _connection: unknown) => {})
const getConnectionMock = mock((_guildId: string): object => ({}))

mock.module('../src/utils', () => ({
  getGuildSettings: getGuildSettingsMock,
  getCurrentSpeakerContext: getCurrentSpeakerContextMock,
  preprocessForTts: preprocessForTtsMock,
  preprocessMessageForTts: preprocessMessageForTtsMock,
  textToSpeechWithSettings: textToSpeechWithSettingsMock
}))

mock.module('../src/utils/notifier', () => ({
  notifyError: notifyErrorMock
}))

mock.module('../src/voice', () => ({
  enqueueAudio: enqueueAudioMock,
  getConnection: getConnectionMock
}))

const { registerMessageHandler } = await import('../src/events/message')

interface FakeMessageOptions {
  authorId: string
  guildId: string
  content: string
  channelId?: string
}

const createFakeMessage = (opts: FakeMessageOptions) => ({
  author: { id: opts.authorId, bot: false },
  guild: {
    id: opts.guildId,
    members: { me: { voice: { channelId: 'vc-1' } } }
  },
  member: { voice: { channelId: 'vc-1' } },
  channel: { id: opts.channelId ?? 'vc-1' },
  content: opts.content
})

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0))

const getMessageHandler = (): ((message: unknown) => Promise<void>) => {
  const handlers: Array<(message: unknown) => Promise<void>> = []
  const fakeClient = {
    on: mock((event: string, handler: (message: unknown) => Promise<void>) => {
      if (event === 'messageCreate') handlers.push(handler)
      return fakeClient
    })
  } as unknown as Client

  registerMessageHandler(fakeClient)
  const handler = handlers[0]
  if (!handler) throw new Error('messageCreate handler was not registered')
  return handler
}

describe('TTS pipeline (events/message.ts)', () => {
  beforeEach(() => {
    pending.clear()
    callOrder.splice(0)
    textToSpeechWithSettingsMock.mockClear()
    getGuildSettingsMock.mockClear()
    getCurrentSpeakerContextMock.mockClear()
    preprocessMessageForTtsMock.mockClear()
    preprocessForTtsMock.mockClear()
    notifyErrorMock.mockClear()
    enqueueAudioMock.mockClear()
    getConnectionMock.mockClear()
  })

  test('1行のメッセージはすぐ再生される', async () => {
    const handler = getMessageHandler()
    const message = createFakeMessage({ authorId: 'user-x', guildId: 'guild-1', content: 'hello' })

    const handlerPromise = handler(message)
    await flush()
    resolveLine('hello')
    await handlerPromise

    expect(enqueueAudioMock).toHaveBeenCalledTimes(1)
    expect(enqueueAudioMock.mock.calls[0]?.[0]).toBe('guild-1')
  })

  test('複数行メッセージは行ごとに解決した順でキューへ積まれる（全行完了を待たない）', async () => {
    const handler = getMessageHandler()
    const message = createFakeMessage({
      authorId: 'user-x',
      guildId: 'guild-1',
      content: 'line-a\nline-b\nline-c'
    })

    const handlerPromise = handler(message)
    await flush()

    // 3行すべての合成が並列で開始されている
    expect(callOrder).toEqual(['line-a', 'line-b', 'line-c'])
    expect(enqueueAudioMock).not.toHaveBeenCalled()

    // 後ろの行が先に終わってもキューにはまだ積まれない（順序保証のため line-a 待ち）
    resolveLine('line-c')
    await flush()
    expect(enqueueAudioMock).not.toHaveBeenCalled()

    // line-a が解決すると、そこで初めて1件だけキューへ積まれる
    resolveLine('line-a')
    await flush()
    expect(enqueueAudioMock).toHaveBeenCalledTimes(1)

    // line-b が解決すると、line-b と（既に解決済みの）line-c が連続で積まれる
    resolveLine('line-b')
    await flush()
    await handlerPromise

    expect(enqueueAudioMock).toHaveBeenCalledTimes(3)
    const enqueuedTexts = enqueueAudioMock.mock.calls.map((call) => (call[1] as PcmAudio).buffer.toString())
    expect(enqueuedTexts).toEqual(['line-a', 'line-b', 'line-c'])
  })

  test('途中の行の合成失敗はスキップされ、他の行は再生される', async () => {
    const handler = getMessageHandler()
    const message = createFakeMessage({
      authorId: 'user-x',
      guildId: 'guild-1',
      content: 'ok-1\nfail-line\nok-2'
    })

    const handlerPromise = handler(message)
    await flush()

    resolveLine('ok-1')
    rejectLine('fail-line')
    resolveLine('ok-2')
    await handlerPromise

    expect(notifyErrorMock).toHaveBeenCalledTimes(1)
    expect(enqueueAudioMock).toHaveBeenCalledTimes(2)
    const enqueuedTexts = enqueueAudioMock.mock.calls.map((call) => (call[1] as PcmAudio).buffer.toString())
    expect(enqueuedTexts).toEqual(['ok-1', 'ok-2'])
  })

  test('異なるユーザーの同時メッセージは互いに混ざらず、各メッセージ内の行順は保たれる', async () => {
    const handler = getMessageHandler()
    const messageX = createFakeMessage({
      authorId: 'user-x',
      guildId: 'guild-1',
      content: 'x-line-0\nx-line-1'
    })
    const messageY = createFakeMessage({
      authorId: 'user-y',
      guildId: 'guild-1',
      content: 'y-line-0\ny-line-1'
    })

    const promiseX = handler(messageX)
    const promiseY = handler(messageY)
    await flush()

    // わざと Y の行を先に、X をあとに解決させて混線を誘発する
    resolveLine('y-line-1')
    resolveLine('x-line-1')
    resolveLine('y-line-0')
    resolveLine('x-line-0')
    await flush()
    await Promise.all([promiseX, promiseY])

    const xCalls = enqueueAudioMock.mock.calls
      .map((call) => call[1] as PcmAudio)
      .filter((audio) => audio.authorId === 'user-x')
    const yCalls = enqueueAudioMock.mock.calls
      .map((call) => call[1] as PcmAudio)
      .filter((audio) => audio.authorId === 'user-y')

    expect(xCalls.map((audio) => audio.lineIndex)).toEqual([0, 1])
    expect(yCalls.map((audio) => audio.lineIndex)).toEqual([0, 1])
  })

  test('話者設定はメッセージごとに1回だけ取得される', async () => {
    const handler = getMessageHandler()
    const message = createFakeMessage({
      authorId: 'user-x',
      guildId: 'guild-1',
      content: 'line-a\nline-b\nline-c'
    })

    const handlerPromise = handler(message)
    await flush()
    resolveLine('line-a')
    resolveLine('line-b')
    resolveLine('line-c')
    await handlerPromise

    expect(getCurrentSpeakerContextMock).toHaveBeenCalledTimes(1)
  })
})
