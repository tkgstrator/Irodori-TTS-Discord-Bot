import { AudioLines } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * 未ログイン時に表示するログイン導線
 *
 * OAuth の開始はサーバー側リダイレクトなので、fetch ではなく素のリンクで遷移する。
 */
export function LoginCard() {
  return (
    <Card className="mx-auto max-w-md text-center">
      <CardHeader className="items-center gap-3">
        <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <AudioLines className="size-6" />
        </span>
        <CardTitle className="text-xl">読み上げ設定をはじめる</CardTitle>
        <CardDescription>
          Discord でログインすると、自分の声や読み上げの細かいパラメータを変更できます。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild size="lg" className="w-full">
          <a href="/api/auth/login">Discord でログイン</a>
        </Button>
      </CardContent>
    </Card>
  )
}
