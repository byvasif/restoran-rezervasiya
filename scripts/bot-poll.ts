import { config } from 'dotenv'

config({ path: '.env' })

/**
 * Development rejimi üçün long-polling botu — ngrok və ya tunel tələb etmir.
 * Production-da bunun əvəzinə webhook istifadə olunur (npm run bot:set-webhook).
 *
 * İstifadə: npm run bot:poll
 */
async function main() {
  const { processUpdate } = await import('../src/lib/telegram/handlers')
  const { TelegramClient } = await import('../src/lib/telegram/client')
  const { prisma } = await import('../src/lib/db/prisma')

  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN təyin edilməyib. .env faylını doldurun.')
    process.exit(1)
  }

  const telegram = new TelegramClient(token)
  const baseUrl = `https://api.telegram.org/bot${token}`

  // Webhook aktivdirsə polling işləmir — əvvəlcə onu söndürürük.
  await fetch(`${baseUrl}/deleteWebhook`, { method: 'POST' })
  console.log('Bot polling rejimində işə düşdü. Dayandırmaq üçün Ctrl+C.')

  let offset = 0
  let running = true

  process.on('SIGINT', () => {
    running = false
    console.log('\nDayandırılır...')
  })

  while (running) {
    try {
      const response = await fetch(`${baseUrl}/getUpdates?timeout=25&offset=${offset}`)
      const data = (await response.json()) as { ok: boolean; result?: Array<{ update_id: number }> }

      for (const update of data.result ?? []) {
        offset = update.update_id + 1
        await processUpdate(update as Parameters<typeof processUpdate>[0], { telegram })
      }
    } catch (error) {
      console.error('Polling xətası:', error instanceof Error ? error.message : error)
      await new Promise((resolve) => setTimeout(resolve, 3000))
    }
  }

  await prisma.$disconnect()
  process.exit(0)
}

main()
