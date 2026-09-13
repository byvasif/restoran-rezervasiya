import { formatDateLong } from '@/i18n/format-date'
import { escapeHtml, type ReservationMessageData } from './types'

/**
 * Sahibkara gedən mesajlar həmişə Azərbaycancadır: restoran işçisi hər bildirişi
 * eyni formatda oxuyur, müştərinin dili nəticəni dəyişmir.
 */
export const ownerMessages = {
  newReservation(data: ReservationMessageData, customerLocale: string): string {
    const telegram = data.telegramUsername
      ? `@${data.telegramUsername.replace(/^@/, '')}`
      : (data.telegramChatId ?? 'göstərilməyib')

    return [
      '🔔 <b>Yeni rezervasiya yaradıldı</b>',
      '',
      `Müştəri: ${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}`,
      `Telefon: ${escapeHtml(data.phoneNumber)}`,
      `Tarix: ${formatDateLong(data.date, 'az')}`,
      `Saat: ${data.startTime} – ${data.endTime}`,
      `Rezervasiya kodu: <b>${escapeHtml(data.reservationCode)}</b>`,
      `Telegram: ${escapeHtml(telegram)}`,
      `Müştərinin dili: ${escapeHtml(customerLocale.toUpperCase())}`,
      data.calendarEventCreated
        ? 'Google Calendar: tədbir yaradıldı ✅'
        : 'Google Calendar: tədbir yaradıla bilmədi ⚠️',
    ].join('\n')
  },

  cancelled(data: ReservationMessageData): string {
    return [
      '⚠️ <b>Rezervasiya ləğv edildi</b>',
      '',
      `Müştəri: ${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}`,
      `Telefon: ${escapeHtml(data.phoneNumber)}`,
      `Tarix: ${formatDateLong(data.date, 'az')}`,
      `Saat: ${data.startTime} – ${data.endTime}`,
      `Rezervasiya kodu: ${escapeHtml(data.reservationCode)}`,
      'Google Calendar tədbiri silindi.',
    ].join('\n')
  },
}
