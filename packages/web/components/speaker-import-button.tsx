import { Suspense, useEffect, useState } from 'react'
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
import { readApiErrorMessage } from '@/lib/backend-api'
import { useSpeakerTemplateMutation, useSuspenseSpeakerImports } from '@/lib/speakers'
import type { SpeakerImportTemplate } from '@/schemas/speaker.dto'

/**
 * 話者候補ダイアログ内のローディング表示を描画する。
 */
const SpeakerImportLoading = () => <p className="text-sm text-muted-foreground">話者一覧を読み込み中です</p>

/**
 * 話者候補一覧の選択 UI を描画する。
 */
const SpeakerImportContent = ({
  disabled,
  isImporting,
  onImport,
  onClose
}: {
  disabled: boolean
  isImporting: boolean
  onImport: (speakerId: string) => Promise<void>
  onClose: () => void
}) => {
  const { speakerItems } = useSuspenseSpeakerImports()
  const [selectedSpeakerId, setSelectedSpeakerId] = useState('')

  useEffect(() => {
    if (speakerItems.length === 0) {
      setSelectedSpeakerId('')
      return
    }

    if (speakerItems.some((speaker) => speaker.speakerId === selectedSpeakerId)) {
      return
    }

    setSelectedSpeakerId(speakerItems[0]?.speakerId ?? '')
  }, [selectedSpeakerId, speakerItems])

  if (speakerItems.length === 0) {
    return (
      <>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">利用可能な話者がまだ登録されていません</p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isImporting}>
            閉じる
          </Button>
          <Button type="button" disabled>
            選択した話者を反映
          </Button>
        </DialogFooter>
      </>
    )
  }

  return (
    <>
      <div className="space-y-3">
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
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={isImporting}>
          閉じる
        </Button>
        <Button
          type="button"
          onClick={() => void onImport(selectedSpeakerId)}
          disabled={disabled || isImporting || selectedSpeakerId.length === 0}
        >
          {isImporting ? '反映中...' : '選択した話者を反映'}
        </Button>
      </DialogFooter>
    </>
  )
}

export const SpeakerImportButton = ({
  disabled = false,
  onImport
}: {
  disabled?: boolean
  onImport: (template: SpeakerImportTemplate) => Promise<void> | void
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const speakerTemplateMutation = useSpeakerTemplateMutation()

  // ダイアログの開閉に合わせて表示状態を初期化する
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)

    if (open) {
      setErrorMessage(null)
    }
  }

  // 選択した話者テンプレートを読み込み元へ返す
  const handleImport = async (speakerId: string) => {
    setIsImporting(true)
    setErrorMessage(null)

    try {
      const template = await speakerTemplateMutation.mutateAsync(speakerId)
      await onImport(template)
      setIsOpen(false)
    } catch (error) {
      setErrorMessage(readApiErrorMessage(error, 'Failed to import speaker template'))
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
        {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
        {isOpen ? (
          <Suspense fallback={<SpeakerImportLoading />}>
            <SpeakerImportContent
              disabled={disabled}
              isImporting={isImporting}
              onImport={handleImport}
              onClose={() => setIsOpen(false)}
            />
          </Suspense>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
