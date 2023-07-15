import { createGoogleAuthClient } from '@/lib/google'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return new Response('only allowed in dev env', { status: 403 })
  }

  const oauth = createGoogleAuthClient({
    redirectUri: `http://${request.headers.get('host')}/oauth2/callback`,
  })
  const url = oauth.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.readonly'],
  })

  redirect(url)
}
