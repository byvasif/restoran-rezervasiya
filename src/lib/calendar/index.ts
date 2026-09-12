import { GoogleCalendar } from './google-calendar'
import type { CalendarPort } from './calendar-port'

let instance: CalendarPort | null = null

/** Tətbiqin istifadə etdiyi təqvim implementasiyası. */
export function getCalendar(): CalendarPort {
  if (!instance) instance = new GoogleCalendar()
  return instance
}

/** Testlər üçün implementasiyanı əvəz edir. */
export function setCalendar(calendar: CalendarPort | null): void {
  instance = calendar
}

export * from './calendar-port'
