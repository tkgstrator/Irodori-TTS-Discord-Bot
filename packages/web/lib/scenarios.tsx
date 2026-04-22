import { createContext, useContext, useMemo, useState } from 'react'
import { plotSeedIds } from './plot-seed-ids'

export type ScenarioStatus = 'draft' | 'generating' | 'completed'
export type ChapterStatus = 'draft' | 'generating' | 'completed'

export interface SpeechCue {
  readonly kind: 'speech'
  readonly speaker: string
  readonly text: string
}

export interface PauseCue {
  readonly kind: 'pause'
  readonly duration: number
}

export type Cue = SpeechCue | PauseCue

export interface Speaker {
  readonly alias: string
  readonly name: string
  readonly initial: string
  readonly imageUrl?: string | null
  readonly colorClass: string
  readonly nameColor: string
}

export interface Chapter {
  readonly id: string
  readonly number: number
  readonly title: string
  readonly status: ChapterStatus
  readonly cueCount: number
  readonly durationMinutes: number
  readonly synopsis: string
  readonly speakers: readonly string[]
  readonly cues: readonly Cue[]
}

export interface Scenario {
  readonly id: string
  readonly title: string
  readonly status: ScenarioStatus
  readonly genres: readonly string[]
  readonly tone: string
  readonly plotCharacters: readonly string[]
  readonly cueCount: number
  readonly speakerCount: number
  readonly durationMinutes: number | null
  readonly isAiGenerated: boolean
  readonly updatedAt: string
  readonly speakers: readonly Speaker[]
  readonly chapters: readonly Chapter[]
}

export type ScenarioInput = Omit<Scenario, 'id'>

// 後続章がある章は時系列整合のため再生成不可とする。
export const canRegenerateChapter = (chapters: readonly Chapter[], chapterId: string): boolean => {
  const chapterIndex = chapters.findIndex((chapter) => chapter.id === chapterId)

  if (chapterIndex < 0) {
    return false
  }

  return chapterIndex === chapters.length - 1
}

interface ScenariosContextValue {
  readonly scenarios: readonly Scenario[]
  readonly getScenario: (id: string) => Scenario | undefined
  readonly addScenario: (input: ScenarioInput) => Scenario
  readonly updateScenario: (id: string, input: ScenarioInput) => void
  readonly deleteScenario: (id: string) => void
}

const ScenariosContext = createContext<ScenariosContextValue | null>(null)

const SPEAKERS_NATSU: readonly Speaker[] = [
  {
    alias: 'renka',
    name: '桜羽エマ',
    initial: '桜',
    colorClass: 'bg-pink-300 text-pink-800',
    nameColor: 'text-pink-700 dark:text-pink-400'
  },
  {
    alias: 'shota',
    name: '二階堂ヒロ',
    initial: '二',
    colorClass: 'bg-blue-300 text-blue-800',
    nameColor: 'text-blue-700 dark:text-blue-400'
  },
  {
    alias: 'narrator',
    name: '月代ユキ',
    initial: '月',
    colorClass: 'bg-purple-300 text-purple-800',
    nameColor: 'text-purple-700 dark:text-purple-400'
  }
]

const CHAPTERS_NATSU: readonly Chapter[] = [
  {
    id: 'ch1',
    number: 1,
    title: '出会い',
    status: 'completed',
    cueCount: 8,
    durationMinutes: 1.5,
    synopsis: '桜羽エマが転校初日に二階堂ヒロと校門前で偶然ぶつかり、散らばったノートを拾い集めるところから物語が始まる。',
    speakers: ['renka', 'shota', 'narrator'],
    cues: [
      {
        kind: 'speech',
        speaker: 'narrator',
        text: '夏の終わり、蝉の声が遠くなった放課後。図書室の窓から差し込む夕日が、古びた机の上の埃を金色に輝かせていた。'
      },
      { kind: 'pause', duration: 0.8 },
      { kind: 'speech', speaker: 'renka', text: 'また来てたんだ。この本、気に入ってるの？' },
      { kind: 'speech', speaker: 'shota', text: '……べつに。どこにいても同じだから。' },
      { kind: 'pause', duration: 1.5 },
      { kind: 'speech', speaker: 'renka', text: 'そんなこと言わないで。……ねえ、名前、教えてくれる？' },
      { kind: 'pause', duration: 0.5 },
      { kind: 'speech', speaker: 'shota', text: '……ヒロ。' },
      { kind: 'speech', speaker: 'renka', text: 'ヒロくん。私はエマ。よろしくね。' }
    ]
  },
  {
    id: 'ch2',
    number: 2,
    title: '秘密の場所',
    status: 'completed',
    cueCount: 10,
    durationMinutes: 2,
    synopsis: '二階堂ヒロが屋上への秘密の抜け道を桜羽エマだけに教え、二人は放課後の秘密の時間を過ごすようになる。',
    speakers: ['renka', 'shota'],
    cues: [
      { kind: 'speech', speaker: 'shota', text: '……ここ、誰も来ない。' },
      { kind: 'speech', speaker: 'renka', text: 'わあ、屋上って初めて。空が近いね！' },
      { kind: 'pause', duration: 1.0 },
      { kind: 'speech', speaker: 'shota', text: '騒ぐなよ。見つかったら面倒だ。' },
      { kind: 'speech', speaker: 'renka', text: 'ふふ、秘密基地みたい。ヒロくんの秘密の場所なんだ。' },
      { kind: 'pause', duration: 0.5 },
      { kind: 'speech', speaker: 'shota', text: '……お前だけだからな。教えたの。' },
      { kind: 'speech', speaker: 'renka', text: 'えっ……うん。約束する、誰にも言わない。' },
      { kind: 'speech', speaker: 'shota', text: '……勝手にしろ。' },
      { kind: 'speech', speaker: 'renka', text: 'じゃあ明日も来るね、ヒロくん。' }
    ]
  },
  {
    id: 'ch3',
    number: 3,
    title: 'すれ違い',
    status: 'completed',
    cueCount: 7,
    durationMinutes: 1,
    synopsis: '文化祭の準備で忙しくなり、桜羽エマと二階堂ヒロの間に小さな誤解が生まれてしまう。',
    speakers: ['renka', 'shota', 'narrator'],
    cues: [
      { kind: 'speech', speaker: 'narrator', text: '文化祭まであと三日。教室は準備の熱気に包まれていた。' },
      { kind: 'speech', speaker: 'renka', text: 'ヒロくん、今日も屋上——' },
      { kind: 'speech', speaker: 'shota', text: '……今日は無理。' },
      { kind: 'pause', duration: 1.0 },
      { kind: 'speech', speaker: 'renka', text: 'そう……。最近ずっとそうだよね。' },
      { kind: 'speech', speaker: 'shota', text: '……悪い。' },
      {
        kind: 'speech',
        speaker: 'narrator',
        text: 'エマは小さく笑って背を向けた。その肩が少しだけ震えているのを、ヒロは気づかなかった。'
      }
    ]
  },
  {
    id: 'ch4',
    number: 4,
    title: '告白',
    status: 'generating',
    cueCount: 9,
    durationMinutes: 1.5,
    synopsis: '夏祭りの夜、花火の光に照らされながら二階堂ヒロが桜羽エマに想いを伝える。',
    speakers: ['renka', 'shota'],
    cues: []
  }
]

const INITIAL_SCENARIOS: readonly Scenario[] = [
  {
    id: plotSeedIds.natsu,
    title: '夏の約束',
    status: 'generating',
    genres: ['学園', '恋愛'],
    tone: 'ほろ苦い',
    plotCharacters: ['桜羽エマ', '二階堂ヒロ', '月代ユキ'],
    cueCount: 34,
    speakerCount: 3,
    durationMinutes: 6,
    isAiGenerated: true,
    updatedAt: '2026-04-20',
    speakers: SPEAKERS_NATSU,
    chapters: CHAPTERS_NATSU
  },
  {
    id: plotSeedIds.fuyu,
    title: '冬の幻想曲',
    status: 'completed',
    genres: ['ファンタジー', 'ミステリー'],
    tone: '幻想的',
    plotCharacters: ['橘シェリー', '氷上メルル', '沢渡ココ', '月代ユキ'],
    cueCount: 36,
    speakerCount: 4,
    durationMinutes: 6,
    isAiGenerated: true,
    updatedAt: '2026-04-21',
    speakers: [],
    chapters: []
  },
  {
    id: plotSeedIds.hoshi,
    title: '星降る夜に',
    status: 'generating',
    genres: ['恋愛', '日常'],
    tone: 'メランコリック',
    plotCharacters: ['花京院ちえり', '蓮見レイア'],
    cueCount: 24,
    speakerCount: 2,
    durationMinutes: 4,
    isAiGenerated: true,
    updatedAt: '2026-04-19',
    speakers: [],
    chapters: []
  },
  {
    id: plotSeedIds.kurenai,
    title: '紅の記憶',
    status: 'completed',
    genres: ['歴史', 'サスペンス'],
    tone: 'シリアス',
    plotCharacters: ['二階堂ヒロ', '宝生マーゴ', '遠野ハンナ', '黒部ナノカ', '月代ユキ'],
    cueCount: 15,
    speakerCount: 5,
    durationMinutes: 3,
    isAiGenerated: true,
    updatedAt: '2026-04-18',
    speakers: [],
    chapters: []
  },
  {
    id: plotSeedIds.souten,
    title: '蒼天の彼方',
    status: 'draft',
    genres: ['SF'],
    tone: '緊迫',
    plotCharacters: [],
    cueCount: 0,
    speakerCount: 0,
    durationMinutes: null,
    isAiGenerated: false,
    updatedAt: '2026-04-22',
    speakers: [],
    chapters: []
  }
]

const generateId = (): string => crypto.randomUUID()

export function ScenariosProvider({ children }: { children: React.ReactNode }) {
  const [scenarios, setScenarios] = useState<Scenario[]>([...INITIAL_SCENARIOS])

  const value = useMemo((): ScenariosContextValue => {
    const getScenario = (id: string) => scenarios.find((scenario) => scenario.id === id)

    const addScenario = (input: ScenarioInput): Scenario => {
      const scenario: Scenario = { ...input, id: generateId() }
      setScenarios((prev) => [...prev, scenario])
      return scenario
    }

    const updateScenario = (id: string, input: ScenarioInput) => {
      setScenarios((prev) => prev.map((s) => (s.id === id ? { ...input, id } : s)))
    }

    const deleteScenario = (id: string) => {
      setScenarios((prev) => prev.filter((s) => s.id !== id))
    }

    return { scenarios, getScenario, addScenario, updateScenario, deleteScenario }
  }, [scenarios])

  return <ScenariosContext.Provider value={value}>{children}</ScenariosContext.Provider>
}

export function useScenarios(): ScenariosContextValue {
  const ctx = useContext(ScenariosContext)
  if (!ctx) throw new Error('useScenarios must be used within ScenariosProvider')
  return ctx
}
