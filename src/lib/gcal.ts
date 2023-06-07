import { google } from 'googleapis'
import { kv } from '@vercel/kv'

export async function hasLunchBreakToday() {
  const events = await getTodaysEvents()
  return events.some((event) =>
    event.summary?.toLowerCase().includes('lunch blocker')
  )
}

async function getTodaysEvents() {
  const auth = await authorize()
  const calendar = google.calendar({ version: 'v3', auth })

  // coding like it's 1997
  const startOfDay = new Date()
  startOfDay.setUTCHours(0, 0, 0, 0)
  const endOfDay = new Date()
  endOfDay.setUTCHours(23, 59, 59, 999)

  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    maxResults: 100,
    singleEvents: true,
    orderBy: 'startTime',
  })
  const events = res.data.items

  return events || []
}

async function authorize() {
  // the token is generated outside of the server and then stored in kv.
  // it is a long-lived refresh_token and can be exchanged to a short-lived
  // access_token
  const refreshToken = await kv.get<string>(process.env.KV_GTOKEN_KEY!)
  if (!refreshToken) {
    throw new Error('refreshToken not stored')
  }

  const oauth = new google.auth.OAuth2({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  })

  // instead of storing the access_token and refreshing it once it has expired,
  // let's just always grab a new access_token
  oauth.setCredentials({ refresh_token: refreshToken })
  const tokens = await oauth.refreshAccessToken()
  oauth.setCredentials(tokens.credentials)

  // apparently the refresh_token shouldn't come back here because
  // it doesn't change, but it _does_ come back... so will it change?
  // who knows. why not just store it if it's there, even if it's the same.
  // won't hurt!
  if (tokens.credentials.refresh_token) {
    await kv.set(process.env.KV_GTOKEN_KEY!, tokens.credentials.refresh_token)
  }

  return oauth
}
