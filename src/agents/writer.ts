import type { BeatSheet } from '../schemas/agent-protocol'
import { type VdsJson, VdsJsonSchema } from '../schemas/voice-drama.dto'
import { generateStructured } from './gemini-client'

/**
 * Writer: BeatSheet を受けて VDS-JSON 1 本を生成する stateless な作家。
 *
 * 責務は `docs/agent-protocol/messages.md §4.5 VdsJson` と `§4.4 BeatSheet` 参照。
 */

const SYSTEM_INSTRUCTION = `
あなたはボイスドラマの作家（Writer）です。編集者（Editor）から渡される BeatSheet を読み、
VDS-JSON 形式で 1 シーン分（約 4〜5 分の再生）の台詞を生成します。

## 出力形式（VDS-JSON）
- \`version\`: 常に \`1\`
- \`speakers\`: alias → \`{ uuid }\`。BeatSheet.speakers のキーと値をそのまま再掲する
- \`cues\`: 上から順に再生される配列
  - \`speech\` cue: \`{ kind: "speech", speaker: "<alias>", text: "<text>" }\`
  - \`pause\` cue: \`{ kind: "pause", duration: <秒数> }\`

## 絶対に守る制約
1. 使う話者 alias は BeatSheet.speakers のキーのみ。BeatSheet に無い alias を使わない。
2. 各キャラの発話内容は \`speakers[alias].knownFactsSnapshot\` の範囲に収める。
   そのキャラが知らない事実を語らせない。
3. \`cue.text\` の各長さは \`constraints.maxCueTextLength\` 以下。
4. \`speech.text\` の総文字数は \`constraints.maxBeatTextLength\` 以下。超えないよう調整する。
5. cue 総数は \`constraints.maxCueCount\` 以下。
6. \`pause.duration\` は \`constraints.allowedPauseRange\` の [min, max] 秒に収める。
7. ナレーションは \`speaker: "narrator"\` の speech cue として書く。
8. \`presentCharacters\` に挙げられたキャラを中心に描写する（unrelated な alias を混ぜない）。
9. \`recentBeats\` の時系列を踏まえ、直前の状況と辻褄を合わせる
   （例: 前 Beat で雨に濡れたキャラが、次 Beat で急に乾いていたら不自然）。
10. \`precedingTailCues\` があれば、その直後から自然に続く流れで書く。

## シーン作りのガイド
- \`beat.goal\` を達成する方向で台詞とナレーションを構成する。
- \`tension\` に合わせて緊張感・テンポを調整する。
- \`sceneKind: "flashback"\` の場合は \`sceneContext\` が現在の時空を上書きする。
  過去の時刻・季節・天気・場所で描写する。
- 各 speaker の \`persona\` と \`speechStyle\` に口調を合わせる。
- speech cue の間に適度に \`pause\` を挟み、会話の呼吸を作る。

## 出力は VDS-JSON のみ
説明文や前置きは一切含めない。純粋な JSON オブジェクトのみ返す。
`.trim()

const buildUserPrompt = (sheet: BeatSheet): string =>
  `次の BeatSheet に従って VDS-JSON を生成してください。

\`\`\`json
${JSON.stringify(sheet, null, 2)}
\`\`\``

/**
 * BeatSheet → VdsJson。
 *
 * @throws Gemini の出力が VdsJson スキーマに合わない場合、`ZodError` を投げる。
 */
export const write = async (sheet: BeatSheet): Promise<VdsJson> => {
  return await generateStructured({
    prompt: buildUserPrompt(sheet),
    schema: VdsJsonSchema,
    systemInstruction: SYSTEM_INSTRUCTION
  })
}
