import { prisma } from '@/lib/db/prisma'
import { env } from '@/config/env'
import { dateStringToDbDate } from '@/lib/time/timezone'

/**
 * Restoran parametrləri və iş qrafiki bazada yaşayır (gələcək sahibkar paneli
 * məhz bu sətirləri redaktə edəcək). Baza boşdursa environment dəyərləri
 * istifadə olunur — belə halda sistem yenə işləyir.
 */

export interface RestaurantSettings {
  restaurantName: string
  restaurantAddress: string
  timezone: string
  bookingDurationMinutes: number
  cancellationDeadlineHours: number
}

export interface DayHours {
  weekday: number
  isOpen: boolean
  openingTime: string | null
  closingTime: string | null
  breakStart: string | null
  breakEnd: string | null
}

export async function getSettings(): Promise<RestaurantSettings> {
  const row = await prisma.businessSettings.findFirst({ orderBy: { createdAt: 'asc' } })
  if (row) {
    return {
      restaurantName: row.restaurantName,
      restaurantAddress: row.restaurantAddress,
      timezone: row.timezone,
      bookingDurationMinutes: row.bookingDurationMinutes,
      cancellationDeadlineHours: row.cancellationDeadlineHours,
    }
  }

  return {
    restaurantName: env.RESTAURANT_NAME,
    restaurantAddress: env.RESTAURANT_ADDRESS,
    timezone: env.TIMEZONE,
    bookingDurationMinutes: env.BOOKING_DURATION_MINUTES,
    cancellationDeadlineHours: env.CANCELLATION_DEADLINE_HOURS,
  }
}

export async function getDayHours(weekday: number): Promise<DayHours | null> {
  const row = await prisma.businessHours.findUnique({ where: { weekday } })
  if (!row) return null
  return {
    weekday: row.weekday,
    isOpen: row.isOpen,
    openingTime: row.openingTime,
    closingTime: row.closingTime,
    breakStart: row.breakStart,
    breakEnd: row.breakEnd,
  }
}

export async function getClosedDate(date: string): Promise<{ reason: string | null } | null> {
  const row = await prisma.closedDate.findUnique({ where: { closedDate: dateStringToDbDate(date) } })
  return row ? { reason: row.reason } : null
}
