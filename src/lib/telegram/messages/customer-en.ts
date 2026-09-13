import { formatDateLong } from '@/i18n/format-date'
import { LANGUAGE_KEYBOARD, escapeHtml, type CustomerMessages } from './types'

export const customerEn: CustomerMessages = {
  start: (bookingUrl) => ({
    text:
      'Hello! Tap the button below to reserve a table at the restaurant.\n\n' +
      'It takes a few seconds: pick a date and time, then add your name and phone number.',
    keyboard: [[{ text: '🍽 Book a table', url: bookingUrl }]],
  }),

  book: (bookingUrl) => ({
    text: 'Tap the button to open the booking page.',
    keyboard: [[{ text: '🍽 Booking page', url: bookingUrl }]],
  }),

  help: (deadlineHours) =>
    [
      '<b>How to use the bot</b>',
      '',
      '/start — shows the booking link',
      '/book — opens the booking page',
      '/cancel — helps you cancel an existing reservation',
      '/dil — changes the bot language',
      '/help — shows this message',
      '',
      'Once a reservation is confirmed you receive a reservation code and a cancel button.',
      `Online cancellation is possible until ${deadlineHours} hours before the reservation starts.`,
    ].join('\n'),

  unknownCommand: () => 'I did not recognise that command. Send /help to see what I can do.',

  cancelNoReservation: () => 'No active reservation found. Send /book to make a new one.',

  cancelList: (reservations) => ({
    text:
      'Here are your active reservations. Tap a button to cancel one.\n\n' +
      reservations
        .map((r) => `• ${formatDateLong(r.date, 'en')} at ${r.startTime} — code: <b>${r.reservationCode}</b>`)
        .join('\n'),
    keyboard: reservations.map((r) => [
      { text: `❌ ${formatDateLong(r.date, 'en')}, ${r.startTime}`, url: r.cancelUrl },
    ]),
  }),

  confirmation: (data, cancelUrl, deadlineHours) => ({
    text: [
      '✅ <b>Your reservation is confirmed.</b>',
      '',
      `Restaurant: ${escapeHtml(data.restaurantName)}`,
      `Name: ${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}`,
      `Date: ${formatDateLong(data.date, 'en')}`,
      `Time: ${data.startTime} – ${data.endTime}`,
      `Reservation code: <b>${escapeHtml(data.reservationCode)}</b>`,
      '',
      'You can cancel the reservation with the button below.',
      `Note: online cancellation works until ${deadlineHours} hours before the reservation starts.`,
    ].join('\n'),
    keyboard: [[{ text: '❌ Cancel reservation', url: cancelUrl }]],
  }),

  cancelled: (data) =>
    [
      '✅ <b>Your reservation was cancelled.</b>',
      '',
      `Restaurant: ${escapeHtml(data.restaurantName)}`,
      `Date: ${formatDateLong(data.date, 'en')}`,
      `Time: ${data.startTime}`,
      `Reservation code: ${escapeHtml(data.reservationCode)}`,
      '',
      'Send /book to make a new reservation.',
    ].join('\n'),

  cancelTooLate: (deadlineHours) =>
    `This reservation starts in less than ${deadlineHours} hours, so it can no longer be cancelled ` +
    'online. Please contact the restaurant directly.',

  languagePrompt: () => ({
    text: 'Which language should the bot use?',
    keyboard: LANGUAGE_KEYBOARD,
  }),

  languageChanged: () => 'Language updated. Send /book to make a reservation.',
}
