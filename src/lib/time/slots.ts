import { addMinutes, minutesToTime, timeToMinutes } from './timezone'

export interface SlotWindow {
  openingTime: string
  closingTime: string
  breakStart?: string | null
  breakEnd?: string | null
  durationMinutes: number
}

export interface BusyInterval {
  /** `HH:mm` */
  start: string
  /** `HH:mm` */
  end: string
}

/** İki aralıq kəsişirsə true. Toxunan sərhədlər (11:00–12:00 və 12:00–13:00) kəsişmir. */
export function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd
}

/**
 * İş saatları aralığında bərabər addımlı slotlar yaradır.
 * Fasilə ilə kəsişən və bağlanışdan sonra bitən slotlar daxil edilmir.
 */
export function generateSlots(window: SlotWindow): string[] {
  const { openingTime, closingTime, breakStart, breakEnd, durationMinutes } = window
  if (durationMinutes <= 0) return []

  const opening = timeToMinutes(openingTime)
  const closing = timeToMinutes(closingTime)
  if (closing <= opening) return []

  const hasBreak = Boolean(breakStart && breakEnd)
  const breakFrom = hasBreak ? timeToMinutes(breakStart as string) : 0
  const breakTo = hasBreak ? timeToMinutes(breakEnd as string) : 0

  const slots: string[] = []
  for (let start = opening; start + durationMinutes <= closing; start += durationMinutes) {
    const end = start + durationMinutes
    if (hasBreak && overlaps(start, end, breakFrom, breakTo)) continue
    slots.push(minutesToTime(start))
  }
  return slots
}

/** Məşğul aralıqlarla kəsişən slotları siyahıdan çıxarır. */
export function filterSlots(slots: string[], busy: BusyInterval[], durationMinutes: number): string[] {
  if (busy.length === 0) return slots
  const busyMinutes = busy.map((interval) => ({
    start: timeToMinutes(interval.start),
    end: timeToMinutes(interval.end),
  }))

  return slots.filter((slot) => {
    const start = timeToMinutes(slot)
    const end = start + durationMinutes
    return !busyMinutes.some((interval) => overlaps(start, end, interval.start, interval.end))
  })
}

/** Verilmiş dəqiqə həddindən əvvəl başlayan slotları çıxarır (bugünkü tarix üçün). */
export function filterPastSlots(slots: string[], earliestMinutes: number): string[] {
  return slots.filter((slot) => timeToMinutes(slot) >= earliestMinutes)
}

export function slotEnd(slot: string, durationMinutes: number): string {
  return addMinutes(slot, durationMinutes)
}
