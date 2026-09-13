import type { Reservation } from '@prisma/client'
import { getSettings } from '@/config/business'
import { env } from '@/config/env'
import type { CalendarPort } from '@/lib/calendar/calendar-port'
import { prisma } from '@/lib/db/prisma'
import { logError, logInfo } from '@/lib/security/log'
import { getCustomerMessages, ownerMessages } from '@/lib/telegram/messages'
import { toLocale } from '@/i18n/locales'
import type { TelegramPort } from '@/lib/telegram/telegram-port'
import { safeCompare } from '@/lib/telegram/verify'
import { dbDateToDateString, toUtcInstant } from '@/lib/time/timezone'
import type { ReservationDeps } from './create'

export type CancelFailureCode = 'NOT_FOUND' | 'INVALID_TOKEN' | 'TOO_LATE' | 'ALREADY_CANCELLED'

export type CancelResult = { ok: true; reservation: Reservation } | { ok: false; code: CancelFailureCode }

export async function findByCode(code: string): Promise<Reservation | null> {
  return prisma.reservation.findUnique({ where: { reservationCode: code.toUpperCase() } })
}

export async function findByCancellationToken(token: string): Promise<Reservation | null> {
  return prisma.reservation.findUnique({ where: { cancellationToken: token } })
}

/** Rezervasiyanın başlanmasına qalan vaxt ləğv üçün kifayətdirmi. */
export function canCancel(
  reservation: Pick<Reservation, 'reservationDate' | 'startTime' | 'timezone'>,
  deadlineHours: number,
  now: Date = new Date(),
): boolean {
  const startsAt = toUtcInstant(
    dbDateToDateString(reservation.reservationDate),
    reservation.startTime,
    reservation.timezone,
  )
  return startsAt.getTime() - now.getTime() >= deadlineHours * 60 * 60 * 1000
}

/**
 * Rezervasiyanı ləğv edir.
 *
 * Yalnız düzgün ləğv tokeni ilə mümkündür — kodu bilmək kifayət etmir, ona görə
 * başqa şəxs sizin rezervasiyanızı ləğv edə bilməz. Ləğvdən sonra slot yenidən
 * boş görünür, təqvim tədbiri silinir və hər iki tərəfə bildiriş gedir.
 */
export async function cancelReservation(code: string, token: string, deps: ReservationDeps): Promise<CancelResult> {
  const reservation = await findByCode(code)
  if (!reservation) return { ok: false, code: 'NOT_FOUND' }

  if (!safeCompare(token, reservation.cancellationToken)) {
    return { ok: false, code: 'INVALID_TOKEN' }
  }

  if (reservation.status === 'cancelled') return { ok: false, code: 'ALREADY_CANCELLED' }
  if (reservation.status !== 'confirmed') return { ok: false, code: 'NOT_FOUND' }

  const settings = await getSettings()
  if (!canCancel(reservation, settings.cancellationDeadlineHours)) {
    return { ok: false, code: 'TOO_LATE' }
  }

  const cancelled = await prisma.reservation.update({
    where: { id: reservation.id },
    data: { status: 'cancelled', cancelledAt: new Date() },
  })

  if (reservation.googleCalendarEventId) {
    try {
      await deps.calendar.deleteEvent(reservation.googleCalendarEventId)
    } catch (error) {
      // Təqvim tədbiri silinməsə də rezervasiya ləğv olunmuş sayılır;
      // sahibkar bildirişdən xəbər tutur.
      logError('reservations.cancel.calendar', error, { reservationCode: reservation.reservationCode })
    }
  }

  const data = {
    restaurantName: settings.restaurantName,
    firstName: cancelled.firstName,
    lastName: cancelled.lastName,
    phoneNumber: cancelled.phoneNumber,
    date: dbDateToDateString(cancelled.reservationDate),
    startTime: cancelled.startTime,
    endTime: cancelled.endTime,
    reservationCode: cancelled.reservationCode,
    telegramUsername: cancelled.telegramUsername,
    telegramChatId: cancelled.telegramChatId,
  }

  if (cancelled.telegramChatId) {
    try {
      // Müştəri rezervasiyanı hansı dildə yaradıbsa, ləğv mesajı da o dildə gedir.
      const customer = getCustomerMessages(toLocale(cancelled.locale))
      await deps.telegram.sendMessage(cancelled.telegramChatId, customer.cancelled(data))
    } catch (error) {
      logError('reservations.cancel.notify.customer', error, { reservationCode: cancelled.reservationCode })
    }
  }

  try {
    await deps.telegram.sendMessage(env.OWNER_TELEGRAM_CHAT_ID, ownerMessages.cancelled(data))
  } catch (error) {
    logError('reservations.cancel.notify.owner', error, { reservationCode: cancelled.reservationCode })
  }

  logInfo('reservations.cancel', 'Rezervasiya ləğv edildi', {
    reservationCode: cancelled.reservationCode,
    date: data.date,
    time: data.startTime,
  })

  return { ok: true, reservation: cancelled }
}

/** İstifadəçiyə göstərilə bilən sahələr — ləğv tokeni heç vaxt daxil edilmir. */
export function toPublicView(reservation: Reservation, restaurantName: string, restaurantAddress: string) {
  return {
    reservationCode: reservation.reservationCode,
    restaurantName,
    restaurantAddress,
    firstName: reservation.firstName,
    lastName: reservation.lastName,
    date: dbDateToDateString(reservation.reservationDate),
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    status: reservation.status,
  }
}
