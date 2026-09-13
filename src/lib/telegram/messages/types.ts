import type { InlineKeyboard } from '../telegram-port'

export interface ReservationMessageData {
  restaurantName: string
  firstName: string
  lastName: string
  phoneNumber: string
  date: string
  startTime: string
  endTime: string
  reservationCode: string
  telegramUsername?: string | null
  telegramChatId?: string | null
  calendarEventCreated?: boolean
}

export interface ActiveReservationLine {
  date: string
  startTime: string
  reservationCode: string
  cancelUrl: string
}

export interface Reply {
  text: string
  keyboard: InlineKeyboard
}

/** Müştəriyə göndərilən bütün mesajlar. Hər dil bu formanı tam doldurur. */
export interface CustomerMessages {
  start(bookingUrl: string): Reply
  book(bookingUrl: string): Reply
  help(deadlineHours: number): string
  unknownCommand(): string
  cancelNoReservation(): string
  cancelList(reservations: ActiveReservationLine[]): Reply
  confirmation(data: ReservationMessageData, cancelUrl: string, deadlineHours: number): Reply
  cancelled(data: ReservationMessageData): string
  cancelTooLate(deadlineHours: number): string
  languagePrompt(): Reply
  languageChanged(): string
}

export function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** `/dil` menyusundakı düymələr — hər dil öz adı ilə göstərilir. */
export const LANGUAGE_KEYBOARD: InlineKeyboard = [
  [
    { text: '🇦🇿 Azərbaycanca', callback_data: 'lang:az' },
    { text: '🇹🇷 Türkçe', callback_data: 'lang:tr' },
    { text: '🇬🇧 English', callback_data: 'lang:en' },
  ],
]
