import * as cheerio from 'cheerio'
import * as htmlToText from 'html-to-text'

export const allMenus = [menuWerner, menuStuermer, menuHembsch]

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

// Fisch Hembsch - https://fisch-hembsch-bestellen.de
// multiple meals per ... day? week? dunno yet
async function menuHembsch() {
  const result = await fetchHtml(
    'https://fisch-hembsch-bestellen.de/12697/cat/192724'
  )
  const $ = cheerio.load(result)

  const menu = $('.products-list-container')
  const html = menu.html()

  if (!html) {
    return null
  }

  const text = htmlToText
    .compile({
      selectors: [
        { selector: 'h5', options: { uppercase: false } },
        {
          selector: '.product-small-picture-container',
          format: 'inlineSurround',
          options: { suffix: '---' },
        },
      ],
    })(html)
    .replace(/Product information/g, '')
    .replace(/Produktinformation/g, '')
    .replace(/^\+$/gm, '')
    .split('---')
    .filter(
      (text) =>
        text.length > 0 && !text.toLocaleLowerCase().includes('ausverkauft')
    )
    .map((text) =>
      text
        .replace(/\n\s*\n\s*\n/gm, '\n')
        .replace(/\n\n/gm, '\n')
        .trim()
    )
    .join('\n\n')

  const header = '🎣 *Fisch Hembsch*'
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
