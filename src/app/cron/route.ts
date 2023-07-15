import { headers } from 'next/headers'
import * as gcal from '@/lib/gcal'
import { allMenus } from '@/lib/menus'
import { sendMessage } from '@/lib/telegram'

export async function GET(request: Request) {
  if (!isAllowed()) {
    console.log('wrong secret')
    return new Response('FORBIDDEN', { status: 403 })
  }

  // skip lunchinTime check with ?skipTimeCheck query param
  const { searchParams } = new URL(request.url)
  const skipTimeCheck = searchParams.has('skipTimeCheck')

  const shouldNotifyMe = await isLunchinTime()
  if (!shouldNotifyMe && !skipTimeCheck) {
    console.log('not lunchin time')
    return new Response('SKIP')
  }

  const menus = await Promise.all(
    allMenus.map((menu) =>
      menu()
        // silently ignore errors. i'll notice when it's missing.
        .catch(() => null)
    )
  )
  await sendMessage(menus.filter((text) => text).join('\n\n'))

  return new Response('OK')
}

function isAllowed() {
  return headers().get('x-cron-secret') === process.env.CRON_SECRET
}

async function isLunchinTime() {
  const SEND_AT_HOUR = 11
  const SEND_AT_DAYS = [1, 2, 3, 4, 5]

  const tzDateString = new Date().toLocaleString('en-US', {
    timeZone: 'Europe/Berlin',
  })
  const tzDate = new Date(tzDateString)

  const isLunchDay = SEND_AT_DAYS.includes(new Date().getDay())
  const isLunchTime = tzDate.getHours() === SEND_AT_HOUR

  if (!isLunchDay || !isLunchTime) {
    return false
  }

  let hasLunchBreak = true
  try {
    hasLunchBreak = await gcal.hasLunchBreakToday()
  } catch (error) {
    console.error(error)
    await sendMessage('🫨 Ohje! Ich konnte den Kalender nicht checken.')
  }

  return hasLunchBreak
}
