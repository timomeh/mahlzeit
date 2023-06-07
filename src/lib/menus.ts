import * as cheerio from 'cheerio'
import * as htmlToText from 'html-to-text'

export const allMenus = [menuWerner, menuStuermer]

// Metzgerei Werner - https://www.wernersmetzgerei.de
// 1 meal per day
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

// Metzgerei Stürmer - https://www.metzgereistuermer.de
// Multiple meals per day
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

async function fetchHtml(url: string) {
  const res = await fetch(url, {
    headers: {
      'user-agent':
        process.env.USER_AGENT ||
        'Mahlzeit/1.0 (https://github.com/timomeh/mahlzeit)',
      'accept-language': 'de',
    },
  })
  const text = await res.text()
  return text
}
