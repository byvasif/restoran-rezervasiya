import { config } from 'dotenv'

config({ path: '.env' })

/**
 * Telegram webhook-unu qoşur və ya söndürür.
 *
 * Qoşmaq:   npm run bot:set-webhook
 * Söndürmək: npm run bot:set-webhook -- --delete
 */
async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  const baseUrl = process.env.APP_BASE_URL

  if (!token || !secret || !baseUrl) {
    console.error('TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET və APP_BASE_URL tələb olunur.')
    process.exit(1)
  }

  const api = `https://api.telegram.org/bot${token}`

  if (process.argv.includes('--delete')) {
    const response = await fetch(`${api}/deleteWebhook`, { method: 'POST' })
    console.log('deleteWebhook:', await response.json())
    return
  }

  const webhookUrl = `${baseUrl.replace(/\/$/, '')}/api/telegram/webhook`
  const response = await fetch(`${api}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: secret,
      allowed_updates: ['message'],
      drop_pending_updates: true,
    }),
  })

  const result = await response.json()
  console.log('setWebhook:', result)
  console.log('Webhook ünvanı:', webhookUrl)

  const info = await fetch(`${api}/getWebhookInfo`)
  console.log('getWebhookInfo:', await info.json())
}

main()
