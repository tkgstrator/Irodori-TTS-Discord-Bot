import {
  AgeGroupSchema,
  FirstPersonSchema,
  GenderSchema,
  HonorificSchema,
  OccupationSchema,
  SecondPersonSchema,
  SpeechStyleSchema
} from '@irodori-tts/shared/enums'

// enum の値と表示ラベルから選択肢一覧を組み立てる
const createOptions = <TValue extends string>(values: readonly TValue[], labels: Record<TValue, string>) =>
  values.map((value) => ({ value, label: labels[value] }))

// 不正値が混ざっても一覧表示を壊さないようにラベルを引く
const findOptionLabel = (options: readonly { value: string; label: string }[], value: string): string =>
  options.find((option) => option.value === value)?.label ?? value

const ageGroupLabels = {
  infant: '乳幼児',
  child: '子供',
  preteen: '小学生',
  teen: '10代',
  young_adult: '青年',
  adult: '成人',
  middle_aged: '中年',
  elderly: '高齢',
  ageless: '不老'
} satisfies Record<(typeof AgeGroupSchema.options)[number], string>

const genderLabels = {
  male: '男性',
  female: '女性',
  nonbinary: 'ノンバイナリー',
  unknown: '不明',
  other: 'その他'
} satisfies Record<(typeof GenderSchema.options)[number], string>

const occupationLabels = {
  student_elementary: '小学生',
  student_middle: '中学生',
  student_high: '高校生',
  student_college: '大学生',
  teacher: '教師',
  professor: '教授',
  researcher: '研究者',
  doctor: '医師',
  nurse: '看護師',
  caregiver: '介護士',
  engineer: 'エンジニア',
  programmer: 'プログラマー',
  scientist: '科学者',
  office_worker: '会社員',
  manager: '管理職',
  entrepreneur: '起業家',
  freelancer: 'フリーランス',
  unemployed: '無職',
  housewife: '主婦',
  artist: 'アーティスト',
  musician: '音楽家',
  writer: '作家',
  journalist: '記者',
  chef: '料理人',
  detective: '探偵',
  police: '警察官',
  lawyer: '弁護士',
  military: '軍人',
  clerk: '店員',
  server: '給仕',
  royalty: '王族',
  knight: '騎士',
  mage: '魔法使い',
  warrior: '戦士',
  priest: '聖職者',
  merchant: '商人',
  adventurer: '冒険者',
  samurai: '侍',
  ninja: '忍者',
  pilot: '操縦士',
  astronaut: '宇宙飛行士',
  other: 'その他'
} satisfies Record<(typeof OccupationSchema.options)[number], string>

const speechStyleLabels = {
  polite_formal: '丁寧語',
  polite_casual: 'やや丁寧',
  neutral: '標準',
  casual_youthful: 'カジュアル',
  rough_masculine: '荒い',
  refined_feminine: '上品',
  archaic_samurai: '武士風',
  archaic_court: '宮廷風',
  dialect_regional: '方言',
  childlike: '子供っぽい',
  eccentric: '独特'
} satisfies Record<(typeof SpeechStyleSchema.options)[number], string>

const firstPersonLabels = {
  watashi: '私',
  watakushi: 'わたくし',
  atashi: 'あたし',
  boku: '僕',
  boku_katakana: 'ボク',
  ore: '俺',
  uchi: 'うち',
  washi: 'ワシ',
  wagahai: 'わがはい',
  ware: '我',
  yo: '余',
  soregashi: 'それがし',
  name: '自分の名前',
  other: 'その他'
} satisfies Record<(typeof FirstPersonSchema.options)[number], string>

const secondPersonLabels = {
  kimi: '君',
  omae: 'お前',
  anata: 'あなた',
  kisama: '貴様',
  temae: 'てめえ',
  onushi: 'お主',
  sonata: 'そなた',
  nanji: '汝',
  other: 'その他'
} satisfies Record<(typeof SecondPersonSchema.options)[number], string>

const honorificLabels = {
  none: '呼び捨て',
  family_name: '苗字',
  given_name: '名前',
  full_name: 'フルネーム',
  san: '〜さん',
  chan: '〜ちゃん',
  kun: '〜君',
  sama: '〜様',
  senpai: '〜先輩',
  sensei: '〜先生',
  tan: '〜たん',
  dono: '〜殿'
} satisfies Record<(typeof HonorificSchema.options)[number], string>

export const AGE_GROUPS = createOptions(AgeGroupSchema.options, ageGroupLabels)
export const GENDERS = createOptions(GenderSchema.options, genderLabels)
export const OCCUPATIONS = createOptions(OccupationSchema.options, occupationLabels)
export const SPEECH_STYLES = createOptions(SpeechStyleSchema.options, speechStyleLabels)
export const FIRST_PERSONS = createOptions(FirstPersonSchema.options, firstPersonLabels)
export const SECOND_PERSONS = createOptions(SecondPersonSchema.options, secondPersonLabels)
export const HONORIFICS = createOptions(HonorificSchema.options, honorificLabels)

export const getAgeGroupLabel = (value: string) => findOptionLabel(AGE_GROUPS, value)
export const getGenderLabel = (value: string) => findOptionLabel(GENDERS, value)
export const getOccupationLabel = (value: string) => findOptionLabel(OCCUPATIONS, value)
export const getSpeechStyleLabel = (value: string) => findOptionLabel(SPEECH_STYLES, value)
export const getFirstPersonLabel = (value: string) => findOptionLabel(FIRST_PERSONS, value)
export const getSecondPersonLabel = (value: string) => findOptionLabel(SECOND_PERSONS, value)
export const getHonorificLabel = (value: string) => findOptionLabel(HONORIFICS, value)
