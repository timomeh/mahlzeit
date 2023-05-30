import { headers } from 'next/headers'
import * as cheerio from 'cheerio'
import * as htmlToText from 'html-to-text'
import * as gcal from '@/lib/gcal'

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

  const menus = await Promise.all([menuStuermer(), menuWerner()])
  await sendMessage(menus.join('\n\n'))

  return new Response('OK')
}

async function menuWerner() {
  const result = await fetchHtml('https://www.wernersmetzgerei.de')
  const $ = cheerio.load(result)

  const dayOfWeek = new Date().getDay()
  const dayMenu = $('.kalendertag')
    .eq(dayOfWeek - 1)
    .siblings()
  const html = dayMenu.html()

  if (!html) {
    return null
  }

  const text = htmlToText
    .compile()(html)
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/\(\*.*\)/g, '')
    .trim()

  const header = '🐷 *Metzgerei Werner*'
  return `${header}\n\n${text}`
}

async function menuStuermer() {
  const result = await fetchHtml('https://www.metzgereistuermer.de/home.html')
  const $ = cheerio.load(result)

  const dayOfWeek = new Date().getDay()
  const weeklyMenu = $(
    `.vertical_nav > .section:nth-child(${dayOfWeek}) > .sectionContent > .sectionWrapper`
  ).first()
  const html = weeklyMenu.html()

  if (!html) {
    return null
  }

  const text = htmlToText
    .compile()(html)
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/\n€/g, ' €')
    .split('\n')
    .filter((line) => !line.includes('Chorweiler')) // don't care about chorweiler
    .map((line) => line.replace(' (Severinstraße)', '')) // unnecessary info now
    .map((line) => line.replace(/^\* /g, ''))
    .join('\n')
    .trim()

  const header = '🍖 *Metzgerei Stürmer*'
  return `${header}\n\n${text}`
}

async function sendMessage(text: string) {
  if (process.env.NODE_ENV === 'development') {
    console.log(text)
    return
  }

  const token = process.env.TELEGRAM_BOT_TOKEN
  const chat_id = process.env.TELEGRAM_CHAT_ID

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id, text, parse_mode: 'markdown' }),
  })
}

async function fetchHtml(url: string) {
  const res = await fetch(url, {
    headers: {
      'user-agent':
        process.env.USER_AGENT ||
        'Mahlzeit/1.0 (https://github.com/timomeh/mahlzeit)',
    },
  })
  const text = await res.text()
  return text
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

  let hasLunchBreak = true
  try {
    hasLunchBreak = await gcal.hasLunchBreakToday()
  } catch (error) {
    console.error(error)
    await sendMessage('🫨 Ohje! Ich konnte den Kalender nicht checken.')
  }

  return isLunchDay && isLunchTime && hasLunchBreak
}
