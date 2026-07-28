import { Hono } from 'hono'
import { buildAuthorizeUrl, exchangeCode, fetchCurrentUser } from '../discord'
import {
  consumeOAuthState,
  createSession,
  destroySession,
  getSession,
  issueOAuthState,
  requireSession,
  type SessionVariables
} from '../session'

export const auth = new Hono<{ Variables: SessionVariables }>()

/**
 * Discord の認可画面へリダイレクトする
 */
auth.get('/login', async (c) => {
  const state = await issueOAuthState()
  return c.redirect(buildAuthorizeUrl(state))
})

/**
 * 認可コードを受け取ってセッションを作る
 */
auth.get('/callback', async (c) => {
  const code = c.req.query('code')
  const state = c.req.query('state')

  if (code === undefined || state === undefined) {
    return c.json({ error: 'Missing code or state' }, 400)
  }

  const stateValid = await consumeOAuthState(state)
  if (!stateValid) {
    return c.json({ error: 'Invalid or expired state' }, 400)
  }

  const tokens = await exchangeCode(code)
  const user = await fetchCurrentUser(tokens.accessToken)

  await createSession(c, {
    user: {
      id: user.id,
      username: user.username,
      globalName: user.global_name ?? null,
      avatar: user.avatar ?? null
    },
    tokens
  })

  return c.redirect('/')
})

/**
 * ログアウトする
 */
auth.post('/logout', async (c) => {
  const session = await getSession(c)
  if (session !== null) {
    await destroySession(c, session.id)
  }
  return c.json({ ok: true })
})

/**
 * ログイン中ユーザーの情報を返す
 */
auth.get('/me', requireSession, (c) => c.json(c.get('session').data.user))
