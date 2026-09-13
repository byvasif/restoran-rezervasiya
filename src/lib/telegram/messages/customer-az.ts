import { formatDateLong } from '@/i18n/format-date'
import { LANGUAGE_KEYBOARD, escapeHtml, type CustomerMessages } from './types'

export const customerAz: CustomerMessages = {
  start: (bookingUrl) => ({
    text:
      'Salam! Restoranda masa rezervasiya etmək üçün aşağıdakı düyməyə klik edin.\n\n' +
      'Rezervasiya cəmi bir neçə saniyə çəkir: tarix və saat seçin, adınızı və telefon nömrənizi yazın.',
    keyboard: [[{ text: '🍽 Rezervasiya et', url: bookingUrl }]],
  }),

  book: (bookingUrl) => ({
    text: 'Rezervasiya səhifəsini açmaq üçün düyməyə klik edin.',
    keyboard: [[{ text: '🍽 Rezervasiya səhifəsi', url: bookingUrl }]],
  }),

  help: (deadlineHours) =>
    [
      '<b>İstifadə qaydaları</b>',
      '',
      '/start — rezervasiya linkini göstərir',
      '/book — rezervasiya səhifəsini açır',
      '/cancel — mövcud rezervasiyanı ləğv etməyə kömək edir',
      '/dil — bot dilini dəyişir',
      '/help — bu mesajı göstərir',
      '',
      'Rezervasiya təsdiqləndikdən sonra sizə rezervasiya kodu və ləğv düyməsi göndərilir.',
      `Rezervasiyanı yalnız başlanma vaxtına ən azı ${deadlineHours} saat qalmış onlayn ləğv etmək mümkündür.`,
    ].join('\n'),

  unknownCommand: () => 'Bu komandanı tanımadım. Mövcud komandaları görmək üçün /help yazın.',

  cancelNoReservation: () =>
    'Sizin aktiv rezervasiyanız tapılmadı. Yeni rezervasiya üçün /book yazın.',

  cancelList: (reservations) => ({
    text:
      'Aktiv rezervasiyalarınız aşağıdadır. Ləğv etmək üçün müvafiq düyməyə klik edin.\n\n' +
      reservations
        .map((r) => `• ${formatDateLong(r.date, 'az')}, saat ${r.startTime} — kod: <b>${r.reservationCode}</b>`)
        .join('\n'),
    keyboard: reservations.map((r) => [
      { text: `❌ ${formatDateLong(r.date, 'az')}, ${r.startTime}`, url: r.cancelUrl },
    ]),
  }),

  confirmation: (data, cancelUrl, deadlineHours) => ({
    text: [
      '✅ <b>Rezervasiyanız təsdiqləndi.</b>',
      '',
      `Restoran: ${escapeHtml(data.restaurantName)}`,
      `Ad: ${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}`,
      `Tarix: ${formatDateLong(data.date, 'az')}`,
      `Saat: ${data.startTime} – ${data.endTime}`,
      `Rezervasiya kodu: <b>${escapeHtml(data.reservationCode)}</b>`,
      '',
      'Rezervasiyanı ləğv etmək üçün aşağıdakı düymədən istifadə edə bilərsiniz.',
      `Qeyd: onlayn ləğv yalnız rezervasiyaya ən azı ${deadlineHours} saat qalmış mümkündür.`,
    ].join('\n'),
    keyboard: [[{ text: '❌ Rezervasiyanı ləğv et', url: cancelUrl }]],
  }),

  cancelled: (data) =>
    [
      '✅ <b>Rezervasiyanız ləğv edildi.</b>',
      '',
      `Restoran: ${escapeHtml(data.restaurantName)}`,
      `Tarix: ${formatDateLong(data.date, 'az')}`,
      `Saat: ${data.startTime}`,
      `Rezervasiya kodu: ${escapeHtml(data.reservationCode)}`,
      '',
      'Yeni rezervasiya üçün /book yazın.',
    ].join('\n'),

  cancelTooLate: (deadlineHours) =>
    `Bu rezervasiyanın başlanmasına ${deadlineHours} saatdan az vaxt qaldığı üçün onlayn ləğv etmək ` +
    'mümkün deyil. Zəhmət olmasa restoranla birbaşa əlaqə saxlayın.',

  languagePrompt: () => ({
    text: 'Bot hansı dildə danışsın?',
    keyboard: LANGUAGE_KEYBOARD,
  }),

  languageChanged: () => 'Dil dəyişdirildi. Rezervasiya üçün /book yazın.',
}
