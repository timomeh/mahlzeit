import { google } from 'googleapis'
import { kv } from '@vercel/kv'

async function authorize() {
  let token = await kv.get<object>(process.env.KV_GTOKEN_KEY!)

  if (!token) {
    throw new Error('token not stored')
  }

  return google.auth.fromJSON(token)
}

async function getTodaysEvents() {
  const auth = await authorize()
  // @ts-expect-error
  const calendar = google.calendar({ version: 'v3', auth })
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

export async function hasLunchBreakToday() {
  const events = await getTodaysEvents()
  return events.some((event) =>
    event.summary?.toLowerCase().includes('lunch blocker')
  )
}
