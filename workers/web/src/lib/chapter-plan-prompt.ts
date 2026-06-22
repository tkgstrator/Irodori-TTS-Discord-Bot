import { SceneKindSchema, TensionSchema } from '@irodori-tts/shared/enums'
import type { ChapterPlanRequest } from '@/schemas/chapter-plan-request.dto'

// Editor に渡す system instruction を定義する。
export const chapterPlanSystemInstruction = `
あなたは物語構成を担当する Editor です。
渡された ChapterPlanRequest を読み、次章の設計だけを JSON で返してください。

必ず守ること:
- scenario.rating に応じた表現レベルを守る（全年齢 → 性的・暴力表現なし / R-15 → 示唆程度まで / R-18 → 制限なし）
- scenario.tone に合った雰囲気・空気感で章を設計する
- 出力は ChapterPlan に一致する JSON オブジェクトのみ
- dramaId は入力と同じ値を返す
- chapter.number は request.nextChapterNumber と一致させる
- beatOutline は 3〜5 個程度で、order は 1 から昇順で重複させない
- presentCharacterIds は request.characters に含まれる id のみ使う（必ず配列で返す）
- sceneKind は ${SceneKindSchema.options.map((value) => `"${value}"`).join(' | ')} のみ
- tension は ${TensionSchema.options.map((value) => `"${value}"`).join(' | ')} のみ
- continuity は必ずオブジェクトにし、mustKeep / reveals / unresolvedThreads の 3 キーをすべて配列で返す
- continuity.mustKeep には、過去章要約から維持すべき前提を簡潔に入れる
- chapter.summary は章保存用に再利用できる密度で書く
- chapter.emotionalArc は必ず文字列で返す（オブジェクトにしない）
- schemaVersion は整数 1 を返す
- 文字列の説明文や Markdown のコードフェンスは一切付けない
- キー名は必ず schemaVersion, dramaId, chapter, continuity, beatOutline を使う
- chapter のキー名は number, title, summary, goal, emotionalArc を使う
- beatOutline の各要素のキー名は order, sceneKind, summary, goal, tension, presentCharacterIds を使う
- 日本語で書く

出力例:
{
  "schemaVersion": 1,
  "dramaId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "chapter": {
    "number": 1,
    "title": "始まりの朝",
    "summary": "主人公が新しい街に到着し、最初の出会いを果たす。",
    "goal": "登場人物の紹介と世界観の提示",
    "emotionalArc": "不安から期待へ"
  },
  "continuity": {
    "mustKeep": ["主人公は前作で故郷を離れた"],
    "reveals": [],
    "unresolvedThreads": ["手紙の差出人が不明"]
  },
  "beatOutline": [
    {
      "order": 1,
      "sceneKind": "dialogue",
      "summary": "主人公が駅に降り立ち、案内人と出会う",
      "goal": "新しい環境への導入",
      "tension": "low",
      "presentCharacterIds": ["xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"]
    }
  ]
}
`.trim()

// ChapterPlanRequest を LLM へ渡す user prompt へ整形する。
export const buildChapterPlanPrompt = (
  request: ChapterPlanRequest
) => `次の ChapterPlanRequest を読み、ChapterPlan を JSON で返してください。

\`\`\`json
${JSON.stringify(request, null, 2)}
\`\`\`
`

// 検証エラーを踏まえて LLM に再生成させるプロンプトを組み立てる。
export const buildChapterPlanRepairPrompt = ({
  request,
  responseText,
  errorMessage
}: {
  request: ChapterPlanRequest
  responseText: string
  errorMessage: string
}) => `前回の JSON は ChapterPlanSchema に一致しませんでした。エラーを修正して���正しい JSON だけを返してください。

修正すべきエラー:
${errorMessage}

特に注意:
- schemaVersion は整数 1（文字列 "1" ではなく数値の 1）
- chapter.emotionalArc は文字列（オブジェクトではない）
- beatOutline の各要素には presentCharacterIds を UUID の配列で必ず含める
- continuity は必ず次の形にしてください:
\`\`\`json
{
  "mustKeep": ["..."],
  "reveals": [],
  "unresolvedThreads": ["..."]
}
\`\`\`

元の ChapterPlanRequest:
\`\`\`json
${JSON.stringify(request, null, 2)}
\`\`\`

前回の不正なレスポンス:
\`\`\`json
${responseText}
\`\`\`
`

// LLM へ渡すデバッグ用 payload を組み立てる。
export const buildChapterPlanDebugPayload = (request: ChapterPlanRequest) => ({
  model: request.model.editor,
  systemInstruction: chapterPlanSystemInstruction,
  contents: buildChapterPlanPrompt(request)
})
