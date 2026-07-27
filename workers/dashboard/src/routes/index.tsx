import { createFileRoute, Link } from '@tanstack/react-router'
import { LoginCard } from '@/components/login-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useLogout, useMe } from '@/lib/auth'

function HomePage() {
  const { me, isPending } = useMe()
  const { logout, isLoggingOut } = useLogout()

  if (isPending) {
    return <Skeleton className="h-40 w-full" />
  }

  if (me === null) {
    return <LoginCard />
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{me.globalName ?? me.username}</CardTitle>
          <CardDescription>ログイン中です。設定はDiscordの読み上げにすぐ反映されます。</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Button asChild>
            <Link to="/voice">話者設定を開く</Link>
          </Button>
          <Button variant="outline" onClick={() => logout()} disabled={isLoggingOut}>
            ログアウト
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: HomePage
})
