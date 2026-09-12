import { env } from '@/config/env'
import type { InlineKeyboard, TelegramPort } from './telegram-port'

/**
 * Telegram Bot API üçün nazik klient. Xəta baş verərsə istisna atılır —
 * çağıran tərəf loglayır və rezervasiya axınını dayandırmır.
 */
export class TelegramClient implements TelegramPort {
  private readonly baseUrl: string

  constructor(token: string = env.TELEGRAM_BOT_TOKEN) {
    this.baseUrl = `https://api.telegram.org/bot${token}`
  }

  private async call(method: string, payload: Record<string, unknown>): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = (await response.json()) as { ok: boolean; description?: string; result?: unknown }
    if (!response.ok || !data.ok) {
      throw new Error(`Telegram ${method} uğursuz oldu: ${data.description ?? response.status}`)
    }
    return data.result
  }

  async sendMessage(chatId: string, text: string, keyboard?: InlineKeyboard): Promise<void> {
    await this.call('sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...(keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {}),
    })
  }

  async answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
    await this.call('answerCallbackQuery', { callback_query_id: callbackQueryId, ...(text ? { text } : {}) })
  }
}

let instance: TelegramPort | null = null

export function getTelegram(): TelegramPort {
  if (!instance) instance = new TelegramClient()
  return instance
}

/** Testlər üçün implementasiyanı əvəz edir. */
export function setTelegram(client: TelegramPort | null): void {
  instance = client
}
