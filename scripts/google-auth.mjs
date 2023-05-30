import 'zx/globals'
import { authenticate } from '@google-cloud/local-auth'
import { kv } from '@vercel/kv'

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']
const CREDENTIALS_PATH = path.join(process.cwd(), 'google-credentials.json')

// Opens browser window, log in, sends result back here
const client = await authenticate({
  scopes: SCOPES,
  keyfilePath: CREDENTIALS_PATH,
})

if (!client.credentials) {
  throw new Error('no credentials returned')
}

const keys = await fs.readJson(CREDENTIALS_PATH)
const key = keys.installed || keys.web
const payload = JSON.stringify({
  type: 'authorized_user',
  client_id: key.client_id,
  client_secret: key.client_secret,
  refresh_token: client.credentials.refresh_token,
})
await kv.set(process.env.KV_GTOKEN_KEY, payload)

console.log('authed and stored 🚀')
