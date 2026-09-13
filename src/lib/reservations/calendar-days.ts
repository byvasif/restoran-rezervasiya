import { DateTime } from 'luxon'
import { getDayHours, getSettings } from '@/config/business'
import { prisma } from '@/lib/db/prisma'
import { dateStringToDbDate } from '@/lib/time/timezone'
import { monthShortName, weekdayName, weekdayShortName } from '@/i18n/format-date'
import { DEFAULT_LOCALE, type Locale } from '@/i18n/locales'

export interface BookingDay {
  date: string
  /** Ayın günü, məsələn "10" */
  dayNumber: string
  /** Qısa həftə günü, məsələn "B.e" */
  weekdayShort: string
  monthShort: string
  isOpen: boolean
  /** Bağlıdırsa səbəb. */
  reason?: string
}

/**
 * Rezervasiya səhifəsindəki tarix lentini qurur: bugündən başlayaraq `days`
 * gün. Bağlı günlər siyahıda qalır, amma seçilə bilmir — müştəri restoranın
 * qrafikini dərhal görür.
 */
export async function getBookingDays(
  days = 21,
  locale: Locale = DEFAULT_LOCALE,
): Promise<{ timezone: string; days: BookingDay[] }> {
  const settings = await getSettings()
  const start = DateTime.now().setZone(settings.timezone).startOf('day')

  const dates = Array.from({ length: days }, (_, index) => start.plus({ days: index }))

  const closedRows = await prisma.closedDate.findMany({
    where: {
      closedDate: {
        gte: dateStringToDbDate(dates[0].toFormat('yyyy-MM-dd')),
        lte: dateStringToDbDate(dates[dates.length - 1].toFormat('yyyy-MM-dd')),
      },
    },
  })

  const closedByDate = new Map(
    closedRows.map((row) => [row.closedDate.toISOString().slice(0, 10), row.reason ?? 'Bağlıdır']),
  )

  const result: BookingDay[] = []
  for (const day of dates) {
    const date = day.toFormat('yyyy-MM-dd')
    const weekday = day.weekday === 7 ? 0 : day.weekday
    const hours = await getDayHours(weekday)
    const closedReason = closedByDate.get(date)

    result.push({
      date,
      dayNumber: day.toFormat('d'),
      weekdayShort: weekdayShortName(weekday, locale),
      monthShort: monthShortName(day.month, locale),
      isOpen: Boolean(hours?.isOpen) && !closedReason,
      reason: closedReason ?? (hours?.isOpen ? undefined : weekdayName(weekday, locale)),
    })
  }

  return { timezone: settings.timezone, days: result }
}
