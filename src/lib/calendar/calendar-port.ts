/**
 * Google Calendar-ın arxasındakı interfeys. Domen məntiqi yalnız bu porta
 * baxır — testlərdə mock verilir, gələcəkdə başqa təqvim provayderi əlavə
 * etmək üçün yalnız yeni implementasiya yazmaq kifayətdir.
 */
export interface BusyPeriod {
  start: Date
  end: Date
}

export interface CalendarEventInput {
  summary: string
  description: string
  location: string
  start: Date
  end: Date
  timezone: string
}

export interface CalendarPort {
  /** Verilmiş aralıqdakı məşğul vaxtlar. */
  getBusy(from: Date, to: Date): Promise<BusyPeriod[]>
  /** Tədbir yaradır və Google tədbir ID-sini qaytarır. */
  createEvent(input: CalendarEventInput): Promise<string>
  /** Tədbiri silir. Tədbir onsuz da yoxdursa səssiz keçir. */
  deleteEvent(eventId: string): Promise<void>
}

export interface ReservationEventData {
  firstName: string
  lastName: string
  phoneNumber: string
  date: string
  startTime: string
  endTime: string
  telegramUsername?: string | null
  telegramChatId?: string | null
  reservationCode: string
  status: string
}

export interface RestaurantEventSettings {
  restaurantAddress: string
  timezone: string
}

/**
 * Təqvim tədbirinin başlığını və təsvirini qurur.
 * Başlıq formatı spesifikasiya ilə təyin olunub: "Restoran rezervasiyası — Ad Soyad".
 */
export function buildEventInput(
  reservation: ReservationEventData,
  settings: RestaurantEventSettings,
  toUtc: (date: string, time: string, timezone: string) => Date,
): CalendarEventInput {
  const telegram = reservation.telegramUsername
    ? `@${reservation.telegramUsername.replace(/^@/, '')}`
    : reservation.telegramChatId ?? 'göstərilməyib'

  const description = [
    `Müştəri: ${reservation.firstName} ${reservation.lastName}`,
    `Telefon: ${reservation.phoneNumber}`,
    `Tarix: ${reservation.date}`,
    `Saat: ${reservation.startTime} – ${reservation.endTime}`,
    `Telegram: ${telegram}`,
    `Rezervasiya kodu: ${reservation.reservationCode}`,
    `Status: ${reservation.status}`,
  ].join('\n')

  return {
    summary: `Restoran rezervasiyası — ${reservation.firstName} ${reservation.lastName}`,
    description,
    location: settings.restaurantAddress,
    start: toUtc(reservation.date, reservation.startTime, settings.timezone),
    end: toUtc(reservation.date, reservation.endTime, settings.timezone),
    timezone: settings.timezone,
  }
}
