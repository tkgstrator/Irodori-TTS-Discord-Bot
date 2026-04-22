import { useEffect, useState } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { SpeakerImportItem, SpeakerImportTemplate } from '@/schemas/speaker.dto'
import { SpeakerImportListSchema, SpeakerImportTemplateSchema } from '@/schemas/speaker.dto'

// API エラーのレスポンス形式を定義する
const ErrorResponseSchema = z.object({
  error: z.string()
})

// API エラーから表示用メッセージを取り出す
const readErrorMessage = async (response: Response) => {
  const text = await response.text()

  if (!text) {
    return `Request failed with status ${response.status}`
  }

  try {
    const jsonResult = ErrorResponseSchema.safeParse(JSON.parse(text))

    if (jsonResult.success) {
      return jsonResult.data.error
    }
  } catch {
    return text
  }

  return `Request failed with status ${response.status}`
}

// JSON API を呼び出してレスポンスを検証する
const requestJson = async <TSchema extends z.ZodTypeAny>(path: string, schema: TSchema) => {
  const response = await fetch(path)

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  const body = await response.json()
  const parsedResult = schema.safeParse(body)

  if (!parsedResult.success) {
    throw new Error('Invalid API response')
  }

  return parsedResult.data
}

export const SpeakerImportButton = ({
  disabled = false,
  onImport
}: {
  disabled?: boolean
  onImport: (template: SpeakerImportTemplate) => Promise<void> | void
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [speakerItems, setSpeakerItems] = useState<readonly SpeakerImportItem[]>([])
  const [selectedSpeakerId, setSelectedSpeakerId] = useState('')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const loadSpeakerItems = async () => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const items = await requestJson('/api/speakers', SpeakerImportListSchema)
        setSpeakerItems(items)
        setSelectedSpeakerId(items[0]?.speakerId ?? '')
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load speakers')
      } finally {
        setIsLoading(false)
      }
    }

    void loadSpeakerItems()
  }, [isOpen])

  // ダイアログの開閉に合わせて表示状態を初期化する
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)

    if (open) {
      setErrorMessage(null)
    }
  }

  // 選択した話者テンプレートを読み込み元へ返す
  const handleImport = async () => {
    if (!selectedSpeakerId) {
      return
    }

    setIsImporting(true)
    setErrorMessage(null)

    try {
      const template = await requestJson(`/api/speakers/${selectedSpeakerId}/template`, SpeakerImportTemplateSchema)
      await onImport(template)
      setIsOpen(false)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to import speaker template')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={disabled}>
          話者候補から選ぶ
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>話者候補を選択</DialogTitle>
          <DialogDescription>API から取得した候補を表示し、選択した話者の初期値を反映します。</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">話者一覧を読み込み中です</p>
          ) : speakerItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">利用可能な話者がまだ登録されていません</p>
          ) : (
            <Select value={selectedSpeakerId} onValueChange={setSelectedSpeakerId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="話者を選択" />
              </SelectTrigger>
              <SelectContent>
                {speakerItems.map((speaker) => (
                  <SelectItem key={speaker.speakerId} value={speaker.speakerId}>
                    {speaker.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isImporting}>
            閉じる
          </Button>
          <Button
            type="button"
            onClick={() => void handleImport()}
            disabled={isImporting || isLoading || !selectedSpeakerId}
          >
            {isImporting ? '反映中...' : '選択した話者を反映'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
