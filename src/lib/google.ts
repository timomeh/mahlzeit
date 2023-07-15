import { google } from 'googleapis'
import { kv } from '@vercel/kv'

export function createGoogleAuthClient(opts: { redirectUri?: string } = {}) {
  return new google.auth.OAuth2({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    ...opts,
  })
}

export async function refreshToken() {
  const refreshToken = await kv.get<string>(process.env.KV_GTOKEN_KEY!)
  return refreshToken
}

export async function storeRefreshToken(token: string) {
  await kv.set(process.env.KV_GTOKEN_KEY!, token)
}
