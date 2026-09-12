import { formatDateAz } from '@/lib/time/format-az'
import type { InlineKeyboard } from './telegram-port'

/**
 * Botun bütün mətnləri. Tərcümə və ya ifadə dəyişikliyi yalnız bu faylda olur.
 * HTML parse_mode istifadə olunduğu üçün istifadəçidən gələn dəyərlər escape edilir.
 */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

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

export const messages = {
  start(bookingUrl: string): { text: string; keyboard: InlineKeyboard } {
    return {
      text:
        'Salam! Restoranda masa rezervasiya etmək üçün aşağıdakı düyməyə klik edin.\n\n' +
        'Rezervasiya cəmi bir neçə saniyə çəkir: tarix və saat seçin, adınızı və telefon nömrənizi yazın.',
      keyboard: [[{ text: '🍽 Rezervasiya et', url: bookingUrl }]],
    }
  },

  book(bookingUrl: string): { text: string; keyboard: InlineKeyboard } {
    return {
      text: 'Rezervasiya səhifəsini açmaq üçün düyməyə klik edin.',
      keyboard: [[{ text: '🍽 Rezervasiya səhifəsi', url: bookingUrl }]],
    }
  },

  help(deadlineHours = 24): string {
    return [
      '<b>İstifadə qaydaları</b>',
      '',
      '/start — rezervasiya linkini göstərir',
      '/book — rezervasiya səhifəsini açır',
      '/cancel — mövcud rezervasiyanı ləğv etməyə kömək edir',
      '/help — bu mesajı göstərir',
      '',
      'Rezervasiya təsdiqləndikdən sonra sizə rezervasiya kodu və ləğv düyməsi göndərilir.',
      `Rezervasiyanı yalnız başlanma vaxtına ən azı ${deadlineHours} saat qalmış onlayn ləğv etmək mümkündür.`,
    ].join('\n')
  },

  cancelNoReservation(): string {
    return 'Sizin aktiv rezervasiyanız tapılmadı. Yeni rezervasiya üçün /book yazın.'
  },

  cancelList(
    reservations: Array<{ date: string; startTime: string; reservationCode: string; cancelUrl: string }>,
  ): { text: string; keyboard: InlineKeyboard } {
    return {
      text:
        'Aktiv rezervasiyalarınız aşağıdadır. Ləğv etmək üçün müvafiq düyməyə klik edin.\n\n' +
        reservations
          .map((r) => `• ${formatDateAz(r.date)}, saat ${r.startTime} — kod: <b>${r.reservationCode}</b>`)
          .join('\n'),
      keyboard: reservations.map((r) => [
        { text: `❌ ${formatDateAz(r.date)}, ${r.startTime} — ləğv et`, url: r.cancelUrl },
      ]),
    }
  },

  unknownCommand(): string {
    return 'Bu komandanı tanımadım. Mövcud komandaları görmək üçün /help yazın.'
  },

  customerConfirmation(
    data: ReservationMessageData,
    cancelUrl: string,
    deadlineHours = 24,
  ): { text: string; keyboard: InlineKeyboard } {
    return {
      text: [
        '✅ <b>Rezervasiyanız təsdiqləndi.</b>',
        '',
        `Restoran: ${escapeHtml(data.restaurantName)}`,
        `Ad: ${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}`,
        `Tarix: ${formatDateAz(data.date)}`,
        `Saat: ${data.startTime} – ${data.endTime}`,
        `Rezervasiya kodu: <b>${escapeHtml(data.reservationCode)}</b>`,
        '',
        'Rezervasiyanı ləğv etmək üçün aşağıdakı düymədən istifadə edə bilərsiniz.',
        `Qeyd: onlayn ləğv yalnız rezervasiyaya ən azı ${deadlineHours} saat qalmış mümkündür.`,
      ].join('\n'),
      keyboard: [[{ text: '❌ Rezervasiyanı ləğv et', url: cancelUrl }]],
    }
  },

  ownerNotification(data: ReservationMessageData): string {
    const telegram = data.telegramUsername
      ? `@${data.telegramUsername.replace(/^@/, '')}`
      : data.telegramChatId ?? 'göstərilməyib'

    return [
      '🔔 <b>Yeni rezervasiya yaradıldı</b>',
      '',
      `Müştəri: ${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}`,
      `Telefon: ${escapeHtml(data.phoneNumber)}`,
      `Tarix: ${formatDateAz(data.date)}`,
      `Saat: ${data.startTime} – ${data.endTime}`,
      `Rezervasiya kodu: <b>${escapeHtml(data.reservationCode)}</b>`,
      `Telegram: ${escapeHtml(telegram)}`,
      data.calendarEventCreated
        ? 'Google Calendar: tədbir yaradıldı ✅'
        : 'Google Calendar: tədbir yaradıla bilmədi ⚠️',
    ].join('\n')
  },

  customerCancelled(data: ReservationMessageData): string {
    return [
      '✅ <b>Rezervasiyanız ləğv edildi.</b>',
      '',
      `Restoran: ${escapeHtml(data.restaurantName)}`,
      `Tarix: ${formatDateAz(data.date)}`,
      `Saat: ${data.startTime}`,
      `Rezervasiya kodu: ${escapeHtml(data.reservationCode)}`,
      '',
      'Yeni rezervasiya üçün /book yazın.',
    ].join('\n')
  },

  ownerCancelled(data: ReservationMessageData): string {
    return [
      '⚠️ <b>Rezervasiya ləğv edildi</b>',
      '',
      `Müştəri: ${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}`,
      `Telefon: ${escapeHtml(data.phoneNumber)}`,
      `Tarix: ${formatDateAz(data.date)}`,
      `Saat: ${data.startTime} – ${data.endTime}`,
      `Rezervasiya kodu: ${escapeHtml(data.reservationCode)}`,
      'Google Calendar tədbiri silindi.',
    ].join('\n')
  },

  cancelTooLate(deadlineHours = 24): string {
    return (
      `Bu rezervasiyanın başlanmasına ${deadlineHours} saatdan az vaxt qaldığı üçün onlayn ləğv etmək ` +
      'mümkün deyil. Zəhmət olmasa restoranla birbaşa əlaqə saxlayın.'
    )
  },
}
