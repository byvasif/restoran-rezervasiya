import { google, type calendar_v3 } from 'googleapis'
import { env, isCalendarConfigured, missingCalendarKeys } from '@/config/env'
import { logWarn } from '@/lib/security/log'
import type { BusyPeriod, CalendarEventInput, CalendarPort } from './calendar-port'
import { withTimeout } from './with-timeout'

/** Google cavab verməsə sorğu bu həddə dayanır. */
const REQUEST_TIMEOUT_MS = 8000

/**
 * Google Calendar API implementasiyası. OAuth 2.0 refresh token ilə işləyir —
 * access token avtomatik yenilənir və heç vaxt frontend-ə göndərilmir.
 */
export class GoogleCalendar implements CalendarPort {
  private client: calendar_v3.Calendar | null = null

  private get calendar(): calendar_v3.Calendar {
    if (!isCalendarConfigured()) {
      throw new Error(
        `Google Calendar konfiqurasiyası tamamlanmayıb — .env faylında bu dəyərlər boşdur: ${missingCalendarKeys().join(', ')}`,
      )
    }
    if (!this.client) {
      const auth = new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_REDIRECT_URI)
      auth.setCredentials({ refresh_token: env.GOOGLE_REFRESH_TOKEN })
      this.client = google.calendar({ version: 'v3', auth })
    }
    return this.client
  }

  async getBusy(from: Date, to: Date): Promise<BusyPeriod[]> {
    const response = await withTimeout(
      this.calendar.freebusy.query(
        {
          requestBody: {
            timeMin: from.toISOString(),
            timeMax: to.toISOString(),
            timeZone: env.TIMEZONE,
            items: [{ id: env.GOOGLE_CALENDAR_ID }],
          },
        },
        { timeout: REQUEST_TIMEOUT_MS },
      ),
      REQUEST_TIMEOUT_MS,
      'Google Calendar freeBusy',
    )

    const periods = response.data.calendars?.[env.GOOGLE_CALENDAR_ID]?.busy ?? []
    return periods
      .filter((period): period is { start: string; end: string } => Boolean(period.start && period.end))
      .map((period) => ({ start: new Date(period.start), end: new Date(period.end) }))
  }

  async createEvent(input: CalendarEventInput): Promise<string> {
    const response = await withTimeout(
      this.calendar.events.insert(
        {
          calendarId: env.GOOGLE_CALENDAR_ID,
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
    try {
      await withTimeout(
        this.calendar.events.delete({ calendarId: env.GOOGLE_CALENDAR_ID, eventId }, { timeout: REQUEST_TIMEOUT_MS }),
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
