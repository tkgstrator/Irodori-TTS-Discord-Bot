import { SceneKindSchema, TensionSchema } from '@irodori-tts/shared/enums'
import type { ChapterPlanRequest } from '@/schemas/chapter-plan-request.dto'

// Editor に渡す system instruction を定義する。
export const chapterPlanSystemInstruction = `
あなたは物語構成を担当する Editor です。
渡された ChapterPlanRequest を読み、次章の設計だけを JSON で返してください。

必ず守ること:
- 出力は ChapterPlan に一致する JSON オブジェクトのみ
- dramaId は入力と同じ値を返す
- chapter.number は request.nextChapterNumber と一致させる
- beatOutline は 3〜5 個程度で、order は 1 から昇順で重複させない
- presentCharacterIds は request.characters に含まれる id のみ使う
- sceneKind は ${SceneKindSchema.options.map((value) => `"${value}"`).join(' | ')} のみ
- tension は ${TensionSchema.options.map((value) => `"${value}"`).join(' | ')} のみ
- continuity は必ずオブジェクトにし、mustKeep / reveals / unresolvedThreads の 3 キーをすべて配列で返す
- continuity.mustKeep には、過去章要約から維持すべき前提を簡潔に入れる
- chapter.summary は章保存用に再利用できる密度で書く
- 文字列の説明文や Markdown のコードフェンスは一切付けない
- キー名は必ず schemaVersion, dramaId, chapter, continuity, beatOutline を使う
- chapter のキー名は number, title, summary, goal, emotionalArc を使う
- beatOutline の各要素のキー名は order, sceneKind, summary, goal, tension, presentCharacterIds を使う
- 日本語で書く
`.trim()

// ChapterPlanRequest を Gemini へ渡す user prompt へ整形する。
export const buildChapterPlanPrompt = (
  request: ChapterPlanRequest
) => `次の ChapterPlanRequest を読み、ChapterPlan を JSON で返してください。

\`\`\`json
${JSON.stringify(request, null, 2)}
\`\`\`
`

// 検証エラーを踏まえて Gemini に再生成させるプロンプトを組み立てる。
export const buildChapterPlanRepairPrompt = ({
  request,
  responseText,
  errorMessage
}: {
  request: ChapterPlanRequest
  responseText: string
  errorMessage: string
}) => `前回の JSON は ChapterPlanSchema に一致しませんでした。エラーを修正して、正しい JSON だけを返してください。

修正すべきエラー:
${errorMessage}

特に continuity は必ず次の形にしてください:
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

// Gemini へ渡すデバッグ用 payload を組み立てる。
export const buildChapterPlanDebugPayload = (request: ChapterPlanRequest) => ({
  model: request.model.editor,
  systemInstruction: chapterPlanSystemInstruction,
  contents: buildChapterPlanPrompt(request)
})
