import { NextResponse } from 'next/server'
import { env } from '@/config/env'
import { getTelegram } from '@/lib/telegram/client'
import { processUpdate, type TelegramUpdate } from '@/lib/telegram/handlers'
import { verifyWebhookSecret } from '@/lib/telegram/verify'
import { logError, logWarn } from '@/lib/security/log'

export const dynamic = 'force-dynamic'

/**
 * POST /api/telegram/webhook — Telegram-dan gələn update-lər.
 *
 * Sorğu `X-Telegram-Bot-Api-Secret-Token` başlığı ilə doğrulanır. Emal xətası
 * baş versə belə Telegram-a 200 qaytarılır, əks halda Telegram eyni update-i
 * dəfələrlə təkrar göndərir.
 */
export async function POST(request: Request) {
  if (!verifyWebhookSecret(request.headers.get('x-telegram-bot-api-secret-token'), env.TELEGRAM_WEBHOOK_SECRET)) {
    logWarn('telegram.webhook', 'Doğrulanmamış webhook sorğusu rədd edildi')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let update: TelegramUpdate
  try {
    update = (await request.json()) as TelegramUpdate
  } catch {
    return NextResponse.json({ ok: true })
  }

  try {
    await processUpdate(update, { telegram: getTelegram() })
  } catch (error) {
    logError('telegram.webhook', error)
  }

  return NextResponse.json({ ok: true })
}
