import { google, type calendar_v3 } from 'googleapis'
import { logWarn } from '@/lib/security/log'
import type { BusyPeriod, CalendarEventInput, CalendarPort } from './calendar-port'
import { loadCalendarCredentials } from './credentials'
import { withTimeout } from './with-timeout'

/** Google cavab verməsə sorğu bu həddə dayanır. */
const REQUEST_TIMEOUT_MS = 8000

export class CalendarNotConnectedError extends Error {
  constructor() {
    super('Google Calendar qoşulmayıb — sahibkar qoşulma linki ilə təqvimi bağlamalıdır')
    this.name = 'CalendarNotConnectedError'
  }
}

/**
 * Google Calendar API implementasiyası.
 *
 * Refresh token bazadan oxunur (sahibkar brauzerdən qoşur), access token
 * avtomatik yenilənir və heç vaxt frontend-ə göndərilmir. Token dəyişərsə
 * klient yenidən qurulur — yenidən deploy tələb olunmur.
 */
export class GoogleCalendar implements CalendarPort {
  private client: calendar_v3.Calendar | null = null
  private clientToken: string | null = null
  private calendarId = 'primary'

  private async calendar(): Promise<calendar_v3.Calendar> {
    const credentials = await loadCalendarCredentials()
    if (!credentials) throw new CalendarNotConnectedError()

    this.calendarId = credentials.calendarId

    if (!this.client || this.clientToken !== credentials.refreshToken) {
      const auth = new google.auth.OAuth2(credentials.clientId, credentials.clientSecret)
      auth.setCredentials({ refresh_token: credentials.refreshToken })
      this.client = google.calendar({ version: 'v3', auth })
      this.clientToken = credentials.refreshToken
    }

    return this.client
  }

  async getBusy(from: Date, to: Date): Promise<BusyPeriod[]> {
    const calendar = await this.calendar()

    const response = await withTimeout(
      calendar.freebusy.query(
        {
          requestBody: {
            timeMin: from.toISOString(),
            timeMax: to.toISOString(),
            items: [{ id: this.calendarId }],
          },
        },
        { timeout: REQUEST_TIMEOUT_MS },
      ),
      REQUEST_TIMEOUT_MS,
      'Google Calendar freeBusy',
    )

    const periods = response.data.calendars?.[this.calendarId]?.busy ?? []
    return periods
      .filter((period): period is { start: string; end: string } => Boolean(period.start && period.end))
      .map((period) => ({ start: new Date(period.start), end: new Date(period.end) }))
  }

  async createEvent(input: CalendarEventInput): Promise<string> {
    const calendar = await this.calendar()

    const response = await withTimeout(
      calendar.events.insert(
        {
          calendarId: this.calendarId,
          requestBody: {
            summary: input.summary,
            description: input.description,
            location: input.location || undefined,
            start: { dateTime: input.start.toISOString(), timeZone: input.timezone },
            end: { dateTime: input.end.toISOString(), timeZone: input.timezone },
          },
        },
        { timeout: REQUEST_TIMEOUT_MS },
      ),
      REQUEST_TIMEOUT_MS,
      'Google Calendar events.insert',
    )

    const eventId = response.data.id
    if (!eventId) throw new Error('Google Calendar tədbir ID-si qaytarmadı')
    return eventId
  }

  async deleteEvent(eventId: string): Promise<void> {
    const calendar = await this.calendar()

    try {
      await withTimeout(
        calendar.events.delete({ calendarId: this.calendarId, eventId }, { timeout: REQUEST_TIMEOUT_MS }),
        REQUEST_TIMEOUT_MS,
        'Google Calendar events.delete',
      )
    } catch (error) {
      const status = (error as { code?: number; status?: number }).code ?? (error as { status?: number }).status
      // Tədbir onsuz da yoxdursa bu xəta deyil — ləğv axını davam etməlidir.
      if (status === 404 || status === 410) {
        logWarn('calendar.deleteEvent', 'Tədbir təqvimdə tapılmadı, keçildi', { eventId })
        return
      }
      throw error
    }
  }
}
