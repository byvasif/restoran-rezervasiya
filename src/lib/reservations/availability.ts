import { getClosedDate, getDayHours, getSettings, type RestaurantSettings } from '@/config/business'
import { prisma } from '@/lib/db/prisma'
import type { BusyPeriod, CalendarPort } from '@/lib/calendar/calendar-port'
import { logWarn } from '@/lib/security/log'
import {
  dateStringToDbDate,
  dayBounds,
  isPastDate,
  isValidDateString,
  minutesToTime,
  nowInZone,
  todayInZone,
  utcToZoneDate,
  utcToZoneTime,
} from '@/lib/time/timezone'
import { filterPastSlots, filterSlots, generateSlots, type BusyInterval } from '@/lib/time/slots'
import { weekdayOf } from '@/lib/time/timezone'
import { env } from '@/config/env'

export interface AvailabilityDeps {
  calendar: CalendarPort
}

export type AvailabilityResult =
  | {
      ok: true
      date: string
      slots: string[]
      closed: boolean
      reason?: string
      durationMinutes: number
    }
  | { ok: false; code: 'INVALID_DATE' | 'PAST_DATE'; message: string }

/**
 * Google Calendar-dan gələn UTC aralıqlarını həmin günün divar saatına çevirir.
 * Günün hüdudlarından kənara çıxan aralıqlar kəsilir.
 */
export function busyToLocalIntervals(periods: BusyPeriod[], date: string, timezone: string): BusyInterval[] {
  const { start: dayStart, end: dayEnd } = dayBounds(date, timezone)

  return periods
    .filter((period) => period.end > dayStart && period.start < dayEnd)
    .map((period) => {
      const start = period.start <= dayStart ? '00:00' : utcToZoneTime(period.start, timezone)
      const endsAfterDay = period.end >= dayEnd
      const end = endsAfterDay
        ? '24:00'
        : utcToZoneDate(period.end, timezone) !== date
          ? '24:00'
          : utcToZoneTime(period.end, timezone)
      return { start, end }
    })
}

/** Bazadakı təsdiqlənmiş rezervasiyaların həmin gün üçün tutduğu aralıqlar. */
async function reservedIntervals(date: string): Promise<BusyInterval[]> {
  const rows = await prisma.reservation.findMany({
    where: { reservationDate: dateStringToDbDate(date), status: 'confirmed' },
    select: { startTime: true, endTime: true },
  })
  return rows.map((row) => ({ start: row.startTime, end: row.endTime }))
}

/**
 * Seçilmiş tarix üçün müştəriyə göstərilə bilən boş saatlar.
 *
 * Ardıcıllıq: tarix doğrulaması → bağlı gün → həftə günü qrafiki → slot
 * generasiyası → bugünkü keçmiş saatların çıxarılması → bazadakı
 * rezervasiyalar → Google Calendar məşğul vaxtları.
 */
export async function getAvailability(date: string, deps: AvailabilityDeps): Promise<AvailabilityResult> {
  if (!isValidDateString(date)) {
    return { ok: false, code: 'INVALID_DATE', message: 'Tarix düzgün formatda deyil.' }
  }

  const settings: RestaurantSettings = await getSettings()
  const timezone = settings.timezone

  if (isPastDate(date, timezone)) {
    return { ok: false, code: 'PAST_DATE', message: 'Keçmiş tarix üçün rezervasiya mümkün deyil.' }
  }

  const closed = await getClosedDate(date)
  if (closed) {
    return {
      ok: true,
      date,
      slots: [],
      closed: true,
      reason: closed.reason ?? 'Bu tarixdə restoran bağlıdır.',
      durationMinutes: settings.bookingDurationMinutes,
    }
  }

  const hours = await getDayHours(weekdayOf(date, timezone))
  if (!hours || !hours.isOpen || !hours.openingTime || !hours.closingTime) {
    return {
      ok: true,
      date,
      slots: [],
      closed: true,
      reason: 'Bu gün restoran işləmir.',
      durationMinutes: settings.bookingDurationMinutes,
    }
  }

  let slots = generateSlots({
    openingTime: hours.openingTime,
    closingTime: hours.closingTime,
    breakStart: hours.breakStart,
    breakEnd: hours.breakEnd,
    durationMinutes: settings.bookingDurationMinutes,
  })

  if (date === todayInZone(timezone)) {
    const now = nowInZone(timezone)
    const earliest = now.hour * 60 + now.minute + env.MIN_LEAD_MINUTES
    slots = filterPastSlots(slots, earliest)
  }

  slots = filterSlots(slots, await reservedIntervals(date), settings.bookingDurationMinutes)

  try {
    const { start, end } = dayBounds(date, timezone)
    const busy = await deps.calendar.getBusy(start, end)
    slots = filterSlots(slots, busyToLocalIntervals(busy, date, timezone), settings.bookingDurationMinutes)
  } catch (error) {
    // Təqvim əlçatmazdırsa siyahı yalnız baza əsasında qaytarılır; rezervasiya
    // yaradılarkən təqvim onsuz da yenidən yoxlanılır.
    logWarn('availability.calendar', 'Google Calendar sorğusu alınmadı, baza əsaslı siyahı qaytarıldı', {
      date,
      error: error instanceof Error ? error.message : String(error),
    })
  }

  return { ok: true, date, slots, closed: false, durationMinutes: settings.bookingDurationMinutes }
}

/** Seçilmiş saatın hələ də boş olduğunu server tərəfdə yenidən yoxlayır. */
export async function isSlotAvailable(date: string, time: string, deps: AvailabilityDeps): Promise<boolean> {
  const result = await getAvailability(date, deps)
  return result.ok && !result.closed && result.slots.includes(time)
}

export { minutesToTime }
