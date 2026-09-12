import type { BusyPeriod, CalendarEventInput, CalendarPort } from '@/lib/calendar/calendar-port'
import type { InlineKeyboard, TelegramPort } from '@/lib/telegram/telegram-port'

/** Testlərdə Google Calendar-ı əvəz edir — şəbəkə sorğusu açmır. */
export class FakeCalendar implements CalendarPort {
  busy: BusyPeriod[] = []
  created: CalendarEventInput[] = []
  deleted: string[] = []
  failOnCreate = false
  failOnBusy = false
  failOnDelete = false
  /** Sorğunu süni gecikdirir — həqiqi race condition ssenarisini qurmaq üçün. */
  busyDelayMs = 0
  private counter = 0

  async getBusy(): Promise<BusyPeriod[]> {
    if (this.busyDelayMs > 0) await new Promise((resolve) => setTimeout(resolve, this.busyDelayMs))
    if (this.failOnBusy) throw new Error('Google Calendar əlçatmazdır (test)')
    return this.busy
  }

  async createEvent(input: CalendarEventInput): Promise<string> {
    if (this.failOnCreate) throw new Error('Google Calendar tədbir yarada bilmədi (test)')
    this.created.push(input)
    this.counter += 1
    return `test-event-${this.counter}`
  }

  async deleteEvent(eventId: string): Promise<void> {
    if (this.failOnDelete) throw new Error('Google Calendar tədbiri silə bilmədi (test)')
    this.deleted.push(eventId)
  }
}

export interface SentMessage {
  chatId: string
  text: string
  keyboard?: InlineKeyboard
}

/** Testlərdə Telegram Bot API-ni əvəz edir. */
export class FakeTelegram implements TelegramPort {
  sent: SentMessage[] = []
  answered: string[] = []
  failOnSend = false

  async sendMessage(chatId: string, text: string, keyboard?: InlineKeyboard): Promise<void> {
    if (this.failOnSend) throw new Error('Telegram mesaj göndərə bilmədi (test)')
    this.sent.push({ chatId, text, keyboard })
  }

  async answerCallbackQuery(callbackQueryId: string): Promise<void> {
    this.answered.push(callbackQueryId)
  }

  messagesTo(chatId: string): SentMessage[] {
    return this.sent.filter((message) => message.chatId === chatId)
  }
}
