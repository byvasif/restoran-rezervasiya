import type { Dictionary } from './az'

/** English dictionary. A missing key fails the TypeScript build. */
export const en: Dictionary = {
  meta: {
    title: 'Table reservation',
    description: 'Pick a date and time to reserve a table at the restaurant.',
    privacyTitle: 'Privacy policy',
    privacyDescription: 'What we collect when you book, and how it is used.',
    termsTitle: 'Terms of use',
    termsDescription: 'The rules for booking a table online.',
  },

  nav: {
    privacy: 'Privacy policy',
    terms: 'Terms of use',
    backToBooking: 'Back to booking',
    newReservation: 'Make a new reservation',
    languageLabel: 'Language',
  },

  booking: {
    intro: 'A table is held for {minutes} minutes. Pick a date and time, add your name, and the booking is confirmed right away.',
    stepNames: { date: 'Date', time: 'Time', details: 'Details', review: 'Review' },
    stepCounter: '{current}/{total} — {name}',

    dateHeading: 'Which day are you coming?',
    dateHint: 'Closed days cannot be selected.',
    dateAriaLabel: 'Date selection',
    closedShort: 'closed',

    timeHeading: 'Pick a time',
    timeAriaLabel: 'Time selection',
    loadingSlots: 'Loading available times…',
    noSlots: 'No times left for this day. Please pick another day.',
    changeDate: 'Change date',

    guestHeading: 'Who should we expect?',
    guestSubtitle: '{date} at {time}',
    firstName: 'First name',
    lastName: 'Last name',
    phone: 'Phone number',
    phoneHint: 'Example: {example}',
    continue: 'Continue',
    changeTime: 'Change time',

    reviewHeading: 'Check your details',
    reviewSubtitle: 'Your reservation code appears once you confirm.',
    labelRestaurant: 'Restaurant',
    labelName: 'Name',
    labelPhone: 'Phone',
    labelDate: 'Date',
    labelTime: 'Time',
    labelCode: 'Reservation code',
    confirm: 'Confirm reservation',
    confirming: 'Confirming…',
    editDetails: 'Edit details',

    errorFirstName: 'Please enter your first name.',
    errorLastName: 'Please enter your last name.',
    errorPhone: 'Please enter the full phone number.',
    errorLoad: 'Could not load available times.',
    errorNetwork: 'Connection failed. Check your internet and try again.',
    errorTimeout: 'The server did not respond in time. Nothing was booked, please try again shortly.',
    errorGeneric: 'Could not complete the reservation. Please try again shortly.',

    hoursHeading: 'Opening hours',
    closedAllDay: 'Closed',
    hoursWithBreak: '{opening} – {closing} (break {breakStart} – {breakEnd})',
    hoursPlain: '{opening} – {closing}',
  },

  success: {
    confirmedHeading: 'Your reservation is confirmed',
    confirmedSubtitle: 'See you soon.',
    cancelledHeading: 'Reservation cancelled',
    cancelledSubtitle: 'This time is free again.',
    cancelHint: 'You can cancel until {hours} hours before the reservation starts.',
    cancelViaTelegram: 'The cancellation link was sent in your Telegram message. You can cancel until {hours} hours before the reservation starts.',
    cancelButton: 'Cancel reservation',
  },

  cancel: {
    heading: 'Cancelling your reservation',
    invalidHeading: 'This cancellation link is not valid',
    invalidBody: 'The link may have expired. Send /cancel to the Telegram bot to see your active reservations.',
    alreadyCancelled: 'This reservation has already been cancelled.',
    tooLate: 'This reservation starts in less than {hours} hours, so it can no longer be cancelled online. Please contact the restaurant directly.',
    confirmButton: 'Yes, cancel the reservation',
    cancelling: 'Cancelling…',
    goBack: 'Never mind, go back',
    doneNotice: 'Your reservation was cancelled. This time is free again.',
    failed: 'Could not cancel.',
  },

  errorPage: {
    heading: 'Something went wrong',
    body: 'The request could not be completed. Try again shortly or contact the restaurant directly.',
    retry: 'Try again',
    renderBody: 'The page could not be displayed. Try again or contact the restaurant directly.',
  },

  notFound: {
    heading: 'Page not found',
    body: 'The reservation or page you are looking for does not exist. Use the link below to make a new booking.',
    link: 'Booking page',
  },

  api: {
    rateLimited: 'Too many requests. Please try again shortly.',
    missingDate: 'No date was provided.',
    invalidDate: 'The date format is not valid.',
    pastDate: 'A reservation cannot be made for a past date.',
    availabilityFailed: 'Could not load available times. Please try again shortly.',
    unreadableBody: 'The request body could not be read.',
    invalidInput: 'The details you entered are not valid.',
    invalidSlot: 'That time is no longer available. Please pick another time.',
    slotTaken: 'Another guest just took this time. Please pick another time.',
    calendarFailed: 'Could not complete the reservation. Please try again shortly.',
    createFailed: 'Could not create the reservation. Please try again shortly.',
    invalidCode: 'The reservation code is not valid.',
    notFound: 'No such reservation was found.',
    readFailed: 'Could not load the details.',
    invalidCancelToken: 'This cancellation link is not valid.',
    alreadyCancelled: 'This reservation has already been cancelled.',
    cancelFailed: 'Could not cancel. Please try again shortly.',
    closedWeekday: 'The restaurant is closed on this day.',
    closedDate: 'The restaurant is closed on this date.',
  },

  validation: {
    nameTooShort: 'Must be at least 2 characters.',
    nameTooLong: 'Can be at most 50 characters.',
    nameInvalid: 'Only letters, spaces, apostrophes and hyphens are allowed.',
    phoneRequired: 'Phone number is required.',
    phoneInvalid: 'The phone number is not valid. Example: {example}',
    dateFormat: 'Date must be in `YYYY-MM-DD` format.',
    timeFormat: 'Time must be in `HH:MM` format.',
    codeInvalid: 'The reservation code is not valid.',
    tokenInvalid: 'The cancellation token is not valid.',
  },

  date: {
    months: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ],
    weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    /** `Monday, 10 May 2027` */
    longFormat: '{weekday}, {day} {month} {year}',
    phoneExample: '+994 50 123 45 67',
  },
}
