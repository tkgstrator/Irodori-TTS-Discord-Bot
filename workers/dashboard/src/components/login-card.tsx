import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * 未ログイン時に表示するログイン導線
 *
 * OAuth の開始はサーバー側リダイレクトなので、fetch ではなく素のリンクで遷移する。
 */
export function LoginCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Discord でログイン</CardTitle>
        <CardDescription>読み上げBotの設定を変更するには Discord アカウントでのログインが必要です。</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <a href="/api/auth/login">Discord でログイン</a>
        </Button>
      </CardContent>
    </Card>
  )
}
