import { google } from 'googleapis'
import { createGoogleAuthClient, refreshToken } from './google'

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
  const token = await refreshToken()
  if (!token) {
    throw new Error('refreshToken not stored')
  }

  const oauth = createGoogleAuthClient()

  // instead of storing the access_token and refreshing it once it has expired,
  // let's just always grab a new access_token
  oauth.setCredentials({ refresh_token: token })
  const tokens = await oauth.refreshAccessToken()
  oauth.setCredentials(tokens.credentials)

  return oauth
}
