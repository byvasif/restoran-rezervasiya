import { DateTime } from 'luxon'

/**
 * Sistemdə bütün vaxtlar konfiqurasiya olunmuş zonanın "divar saatı" kimi
 * saxlanılır (məsələn Asia/Baku üzrə 19:00). UTC anı yalnız Google Calendar
 * sorğuları üçün burada hesablanır.
 */

export const DATE_FORMAT = 'yyyy-MM-dd'
export const TIME_FORMAT = 'HH:mm'

/** `2027-05-10` + `19:00` + `Asia/Baku` → həmin anın UTC Date obyekti. */
export function toUtcInstant(date: string, time: string, timezone: string): Date {
  const dt = DateTime.fromFormat(`${date} ${time}`, `${DATE_FORMAT} ${TIME_FORMAT}`, { zone: timezone })
  if (!dt.isValid) {
    throw new Error(`Yanlış tarix və ya saat: ${date} ${time} (${timezone})`)
  }
  return dt.toJSDate()
}

/** Verilmiş zonada hazırkı an. */
export function nowInZone(timezone: string): DateTime {
  return DateTime.now().setZone(timezone)
}

/** Verilmiş zonada bugünkü tarix (`yyyy-MM-dd`). */
export function todayInZone(timezone: string): string {
  return nowInZone(timezone).toFormat(DATE_FORMAT)
}

/** 0 = Bazar, 1 = Bazar ertəsi ... 6 = Şənbə */
export function weekdayOf(date: string, timezone: string): number {
  const dt = DateTime.fromFormat(date, DATE_FORMAT, { zone: timezone })
  if (!dt.isValid) throw new Error(`Yanlış tarix: ${date}`)
  // luxon: 1 = Bazar ertəsi ... 7 = Bazar
  return dt.weekday === 7 ? 0 : dt.weekday
}

export function isValidDateString(date: string): boolean {
  return DateTime.fromFormat(date, DATE_FORMAT, { zone: 'utc' }).isValid
}

export function isValidTimeString(time: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time)
}

/** `date` bugündən əvvəldirsə true (zonanın təqvim gününə görə). */
export function isPastDate(date: string, timezone: string): boolean {
  return date < todayInZone(timezone)
}

/** `HH:mm` → gün başlanğıcından keçən dəqiqə sayı. */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/** Dəqiqə → `HH:mm`. */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

export function addMinutes(time: string, minutes: number): string {
  return minutesToTime(timeToMinutes(time) + minutes)
}

/**
 * Prisma `@db.Date` sütunu UTC yarım gecə kimi saxlanılır — sətir tarixini
 * həmin formaya və əksinə çevirir.
 */
export function dateStringToDbDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`)
}

export function dbDateToDateString(date: Date): string {
  return DateTime.fromJSDate(date, { zone: 'utc' }).toFormat(DATE_FORMAT)
}

/** UTC anını verilmiş zonanın `HH:mm` divar saatına çevirir. */
export function utcToZoneTime(instant: Date, timezone: string): string {
  return DateTime.fromJSDate(instant, { zone: timezone }).toFormat(TIME_FORMAT)
}

/** UTC anının verilmiş zonadakı təqvim tarixi. */
export function utcToZoneDate(instant: Date, timezone: string): string {
  return DateTime.fromJSDate(instant, { zone: timezone }).toFormat(DATE_FORMAT)
}

/** Verilmiş tarixin zonada başlanğıc və bitmə anları. */
export function dayBounds(date: string, timezone: string): { start: Date; end: Date } {
  const start = DateTime.fromFormat(date, DATE_FORMAT, { zone: timezone }).startOf('day')
  if (!start.isValid) throw new Error(`Yanlış tarix: ${date}`)
  return { start: start.toJSDate(), end: start.plus({ days: 1 }).toJSDate() }
}
