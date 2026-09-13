import type { LegalContent } from './az'

export const legalEn: LegalContent = {
  privacy: {
    title: 'Privacy policy',
    updatedAt: '13 September 2026',
    intro:
      'This page explains what the online table reservation system of {restaurant} collects, why it is used, and how long it is kept.',
    sections: [
      {
        heading: 'What we collect',
        paragraphs: ['Creating a reservation requires only the following:'],
        bullets: [
          'First and last name, so the table is held under a name',
          'Phone number, so the restaurant can reach you about the booking',
          'The date and time you selected',
          'Your Telegram user ID if you arrived through the bot, so confirmation and cancellation messages can be delivered',
        ],
      },
      {
        heading: 'What we do not collect',
        paragraphs: [
          'No payment or card details are collected, because the system has no online payment. No email address is required. No location data, device trackers or advertising cookies are used.',
        ],
      },
      {
        heading: 'Where the data is stored',
        paragraphs: [
          'Reservation details are stored in the restaurant database. The reservation is also created as an event in the restaurant Google Calendar, where your name, phone number and reservation code are shown so the staff can welcome you.',
          'In server logs the phone number and name are masked, never written in clear text.',
        ],
      },
      {
        heading: 'Who it is shared with',
        paragraphs: [
          'Your data is not sold to third parties and is not shared for advertising. Only the services required to run the system are used: Google Calendar to place the booking in the calendar, and Telegram to deliver notifications.',
        ],
      },
      {
        heading: 'How long it is kept',
        paragraphs: [
          'Reservation records are kept for the restaurant own bookkeeping. If you want your data deleted, contact the restaurant directly.',
        ],
      },
      {
        heading: 'Cancelling a reservation',
        paragraphs: [
          'You can cancel yourself using the link in the confirmation message until {hours} hours before the reservation starts. On cancellation the calendar event is deleted and the time becomes free again.',
        ],
      },
      {
        heading: 'Contact',
        paragraphs: [
          'If you have any question about your data, contact {restaurant} directly. {address}',
        ],
      },
    ],
  },

  terms: {
    title: 'Terms of use',
    updatedAt: '13 September 2026',
    intro:
      'This page explains the rules for using the online reservation page of {restaurant}. By creating a reservation you accept these terms.',
    sections: [
      {
        heading: 'Reservations',
        paragraphs: [
          'Each reservation covers a {minutes} minute slot. Only times inside the opening hours that are still free can be selected; past dates and closed days are not available.',
          'Once confirmed you receive a unique reservation code. Showing that code on arrival is enough.',
        ],
      },
      {
        heading: 'Cancellation',
        paragraphs: [
          'You can cancel using the link in the confirmation message until {hours} hours before the reservation starts.',
          'Closer than {hours} hours the online cancellation closes: in that case contact the restaurant directly.',
        ],
      },
      {
        heading: 'Late arrival and no-show',
        paragraphs: [
          'If you do not arrive at the reserved time, the table may be released after a short waiting period. If you know you will be late, please let the restaurant know.',
        ],
      },
      {
        heading: 'Accurate details',
        paragraphs: [
          'Entering the correct name and phone number matters, because that number is the only way the restaurant can reach you. A reservation made with false details or someone else details may be cancelled by the restaurant.',
        ],
      },
      {
        heading: 'Availability of the service',
        paragraphs: [
          'The system is built to run continuously, but it may be temporarily unavailable for technical reasons. In that case you can book by contacting the restaurant directly.',
          'There is no payment system, and no payment is required to book.',
        ],
      },
      {
        heading: 'Contact',
        paragraphs: ['For questions contact {restaurant}. {address}'],
      },
    ],
  },
}
