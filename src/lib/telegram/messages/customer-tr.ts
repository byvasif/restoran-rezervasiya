import { formatDateLong } from '@/i18n/format-date'
import { LANGUAGE_KEYBOARD, escapeHtml, type CustomerMessages } from './types'

export const customerTr: CustomerMessages = {
  start: (bookingUrl) => ({
    text:
      'Merhaba! Restoranda masa ayırtmak için aşağıdaki düğmeye dokunun.\n\n' +
      'Rezervasyon birkaç saniye sürer: tarih ve saat seçin, adınızı ve telefon numaranızı yazın.',
    keyboard: [[{ text: '🍽 Rezervasyon yap', url: bookingUrl }]],
  }),

  book: (bookingUrl) => ({
    text: 'Rezervasyon sayfasını açmak için düğmeye dokunun.',
    keyboard: [[{ text: '🍽 Rezervasyon sayfası', url: bookingUrl }]],
  }),

  help: (deadlineHours) =>
    [
      '<b>Kullanım kuralları</b>',
      '',
      '/start — rezervasyon bağlantısını gösterir',
      '/book — rezervasyon sayfasını açar',
      '/cancel — mevcut rezervasyonu iptal etmenize yardım eder',
      '/dil — bot dilini değiştirir',
      '/help — bu mesajı gösterir',
      '',
      'Rezervasyon onaylandıktan sonra size rezervasyon kodu ve iptal düğmesi gönderilir.',
      `Rezervasyonu yalnızca başlama saatine en az ${deadlineHours} saat kala çevrimiçi iptal edebilirsiniz.`,
    ].join('\n'),

  unknownCommand: () => 'Bu komutu tanımadım. Mevcut komutlar için /help yazın.',

  cancelNoReservation: () => 'Aktif rezervasyonunuz bulunamadı. Yeni rezervasyon için /book yazın.',

  cancelList: (reservations) => ({
    text:
      'Aktif rezervasyonlarınız aşağıda. İptal etmek için ilgili düğmeye dokunun.\n\n' +
      reservations
        .map((r) => `• ${formatDateLong(r.date, 'tr')}, saat ${r.startTime} — kod: <b>${r.reservationCode}</b>`)
        .join('\n'),
    keyboard: reservations.map((r) => [
      { text: `❌ ${formatDateLong(r.date, 'tr')}, ${r.startTime}`, url: r.cancelUrl },
    ]),
  }),

  confirmation: (data, cancelUrl, deadlineHours) => ({
    text: [
      '✅ <b>Rezervasyonunuz onaylandı.</b>',
      '',
      `Restoran: ${escapeHtml(data.restaurantName)}`,
      `Ad: ${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}`,
      `Tarih: ${formatDateLong(data.date, 'tr')}`,
      `Saat: ${data.startTime} – ${data.endTime}`,
      `Rezervasyon kodu: <b>${escapeHtml(data.reservationCode)}</b>`,
      '',
      'Rezervasyonu iptal etmek için aşağıdaki düğmeyi kullanabilirsiniz.',
      `Not: çevrimiçi iptal yalnızca rezervasyona en az ${deadlineHours} saat kala mümkündür.`,
    ].join('\n'),
    keyboard: [[{ text: '❌ Rezervasyonu iptal et', url: cancelUrl }]],
  }),

  cancelled: (data) =>
    [
      '✅ <b>Rezervasyonunuz iptal edildi.</b>',
      '',
      `Restoran: ${escapeHtml(data.restaurantName)}`,
      `Tarih: ${formatDateLong(data.date, 'tr')}`,
      `Saat: ${data.startTime}`,
      `Rezervasyon kodu: ${escapeHtml(data.reservationCode)}`,
      '',
      'Yeni rezervasyon için /book yazın.',
    ].join('\n'),

  cancelTooLate: (deadlineHours) =>
    `Bu rezervasyonun başlamasına ${deadlineHours} saatten az kaldığı için çevrimiçi iptal mümkün ` +
    'değil. Lütfen restoranla doğrudan iletişime geçin.',

  languagePrompt: () => ({
    text: 'Bot hangi dilde konuşsun?',
    keyboard: LANGUAGE_KEYBOARD,
  }),

  languageChanged: () => 'Dil değiştirildi. Rezervasyon için /book yazın.',
}
