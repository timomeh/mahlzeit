export async function sendMessage(text: string) {
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
