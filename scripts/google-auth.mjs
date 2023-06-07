import 'zx/globals'
import { google } from 'googleapis'
import { kv } from '@vercel/kv'

const scope = ['https://www.googleapis.com/auth/calendar.readonly']
const oauth = new google.auth.OAuth2({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: 'urn:ietf:wg:oauth:2.0:oob', // will show the code instead of doing a redirect
})

const url = oauth.generateAuthUrl({
  access_type: 'offline',
  scope,
})

await $`open ${url}`
console.log('Authorize in the browser. After that, paste the code here.')
const authCode = await question('Code: ')

const { tokens } = await oauth.getToken(authCode)
await kv.set(process.env.KV_GTOKEN_KEY, tokens.refresh_token)

console.log('authed and stored 🚀')
