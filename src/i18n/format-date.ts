import { DateTime } from 'luxon'
import { getDictionary } from '.'
import { fill } from './fill'
import { DEFAULT_LOCALE, type Locale } from './locales'

/** 0 = Bazar ... 6 = Şənbə */
export function weekdayName(weekday: number, locale: Locale = DEFAULT_LOCALE): string {
  return getDictionary(locale).date.weekdays[weekday] ?? ''
}

export function weekdayShortName(weekday: number, locale: Locale = DEFAULT_LOCALE): string {
  return getDictionary(locale).date.weekdaysShort[weekday] ?? ''
}

export function monthName(month: number, locale: Locale = DEFAULT_LOCALE): string {
  return getDictionary(locale).date.months[month - 1] ?? ''
}

/** Ayın qısa adı — tarix lentindəki kiçik yazı üçün. */
export function monthShortName(month: number, locale: Locale = DEFAULT_LOCALE): string {
  const full = monthName(month, locale)
  return full.length > 4 ? full.slice(0, 3) : full
}

/**
 * `2027-05-10` → `10 may 2027, Bazar ertəsi` (az) / `Monday, 10 May 2027` (en).
 * Sıralama hər dilin öz `longFormat` şablonundan gəlir.
 */
export function formatDateLong(date: string, locale: Locale = DEFAULT_LOCALE): string {
  const dt = DateTime.fromFormat(date, 'yyyy-MM-dd', { zone: 'utc' })
  if (!dt.isValid) return date

  const weekday = dt.weekday === 7 ? 0 : dt.weekday
  return fill(getDictionary(locale).date.longFormat, {
    day: dt.day,
    month: monthName(dt.month, locale),
    year: dt.year,
    weekday: weekdayName(weekday, locale),
  })
}

/** `2027-05-10` → `10 may` */
export function formatDateShort(date: string, locale: Locale = DEFAULT_LOCALE): string {
  const dt = DateTime.fromFormat(date, 'yyyy-MM-dd', { zone: 'utc' })
  if (!dt.isValid) return date
  return `${dt.day} ${monthName(dt.month, locale)}`
}
