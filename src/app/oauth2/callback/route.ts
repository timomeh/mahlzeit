import { createGoogleAuthClient, storeRefreshToken } from '@/lib/google'

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('only locally')
  }

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  if (!code) {
    throw new Error('code not present')
  }

  const oauth = createGoogleAuthClient({
    redirectUri: `http://${request.headers.get('host')}/oauth2/callback`,
  })
  const { tokens } = await oauth.getToken(code)
  if (!tokens.refresh_token) {
    throw new Error('tokens did not include refresh token')
  }

  await storeRefreshToken(tokens.refresh_token)

  return new Response('cool, worked')
}
